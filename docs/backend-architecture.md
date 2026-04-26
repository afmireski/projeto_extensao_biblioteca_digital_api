# Arquitetura do Backend — Digitalizador com OCR para Fontes Históricas

**Versão:** 0.3  
**Stack:** Bun · TypeScript · Express · PostgreSQL · Kysely · Awilix  
**Escopo:** Backend apenas

---

## 1. Visão geral da arquitetura

O backend segue uma arquitetura em camadas com módulos por domínio. Cada módulo é
autocontido: tem seu roteador, controller, service e repositório. A inversão de
dependência é feita via container Awilix, o que permite trocar implementações
(ex.: storage local → S3) sem tocar nas regras de negócio.

```
HTTP Request
    └── Express Router
            └── Controller                   ← recebe req/res, valida entrada, chama service
                    └── Service              ← orquestração e execução de regras de negócio, depende só de interfaces (ports)
                            └── IRepository  ← port: interface definida dentro do módulo
                            │       └── Repository  ← adapter: implementação Kysely
                            └── IStorageAdapter  ← port: interface em infra/storage
                                    └── LocalStorageAdapter  ← adapter: implementação local
```

Nenhuma camada "pula" outra. Controller não acessa repositório diretamente. Service
não sabe nada de HTTP nem de Kysely — depende apenas das interfaces (ports).

---

## 2. Estrutura de pastas

```
/
├── src/
│   ├── container.ts             # Bootstrap do Awilix (registro de todas as dependências)
│   ├── server.ts                # Inicialização do Express + escuta na porta
│   ├── app.ts                   # Configuração do Express (middlewares globais, routers)
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.port.ts    # interface IAuthRepository
│   │   │   ├── auth.repository.ts         # implementação Kysely
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── acervo/
│   │   │   ├── acervo.router.ts
│   │   │   ├── acervo.controller.ts
│   │   │   ├── acervo.service.ts
│   │   │   ├── acervo.repository.port.ts  # interface IAcervoRepository
│   │   │   ├── acervo.repository.ts       # implementação Kysely
│   │   │   └── acervo.types.ts
│   │   │
│   │   ├── fonte/
│   │   │   ├── fonte.router.ts
│   │   │   ├── fonte.controller.ts
│   │   │   ├── fonte.service.ts
│   │   │   ├── fonte.repository.port.ts   # interface IFonteRepository
│   │   │   ├── fonte.repository.ts        # implementação Kysely
│   │   │   └── fonte.types.ts
│   │   │
│   │   ├── edicao/
│   │   │   ├── edicao.router.ts
│   │   │   ├── edicao.controller.ts
│   │   │   ├── edicao.service.ts
│   │   │   ├── edicao.repository.port.ts  # interface IEdicaoRepository
│   │   │   ├── edicao.repository.ts       # implementação Kysely
│   │   │   └── edicao.types.ts
│   │   │
│   │   ├── pagina/
│   │   │   ├── pagina.router.ts
│   │   │   ├── pagina.controller.ts
│   │   │   ├── pagina.service.ts
│   │   │   ├── pagina.repository.port.ts  # interface IPaginaRepository
│   │   │   ├── pagina.repository.ts       # implementação Kysely
│   │   │   └── pagina.types.ts
│   │   │
│   │   └── busca/
│   │       ├── busca.router.ts
│   │       ├── busca.controller.ts
│   │       ├── busca.service.ts
│   │       └── busca.types.ts             # sem repositório — leitura direta via Kysely injetado
│   │
│   ├── infra/
│   │   ├── database/
│   │   │   ├── client.ts          # Instância do Kysely + pool (pg)
│   │   │   ├── types.ts           # Database interface (tabelas tipadas para o Kysely)
│   │   │   └── migrations/        # Arquivos gerenciados pelo Kysely Migrator
│   │   │                          # Ex.: 2024-01-01-init.ts, 2024-01-02-add-tsv.ts
│   │   │
│   │   └── storage/
│   │       ├── storage.interface.ts   # IStorageAdapter
│   │       └── local.adapter.ts       # Implementação local (MVP)
│   │
│   └── shared/
│       ├── middleware/
│       │   ├── auth.middleware.ts     # Verifica JWT, popula req.user
│       │   ├── role.middleware.ts     # Verifica perfil (leitor / gestor)
│       │   └── error.middleware.ts    # Handler global de erros
│       │
│       ├── errors/
│       │   └── app-errors.ts
│       │
│       └── types/
│           └── express.d.ts           # Augment de Request (req.user, req.container)
│
├── tests/
│   ├── unit/                          # Por módulo, espelha src/modules
│   └── integration/                   # Testa o endpoint de ponta a ponta com banco real
│
├── docs/
│   └── api/
│       ├── main.tsp                   # Entrypoint do TypeSpec
│       ├── models/                    # Modelos de dados (.tsp)
│       └── routes/                    # Definições de rotas por módulo (.tsp)
│
├── scripts/
│   └── migrate.ts                     # Runner de migrations Kysely
│
├── .env.example
├── bunfig.toml
├── tsconfig.json
└── package.json
```

---

## 3. Módulos — responsabilidades

### 3.1 `auth`

Gerencia autenticação e sessão via email + senha com JWT.

- **Fluxo:** `POST /auth/login` recebe credenciais → service valida senha com
  `Bun.password.verify` → registra uma sessão ativa no banco e emite JWT assinado contendo o ID da sessão. `POST /users/signup` cria o usuário
  com hash gerado por `Bun.password.hash` (bcrypt por padrão no Bun).
- **Sessões Stateful:** O JWT atua como portador do ID da sessão. Para invalidação no logout, a sessão correspondente é deletada da tabela de `sessions` no Postgres. Isso permite que o usuário tenha múltiplas sessões ativas (vários dispositivos).
- **Repositório:** lê e escreve na tabela `users` e na tabela `sessions`.

### 3.2 `acervo`

Representa a coleção de topo da hierarquia.

- CRUD básico com validação de permissão (apenas gestor cria/remove).
- Campos: `nome`, `descricao`, `instituicao`.

### 3.3 `fonte`

Representa um periódico, livro ou revista dentro de um acervo.

- Metadados comuns + metadados específicos por tipo armazenados em coluna `metadata JSONB`.
- O `tipo` (`jornal | revista | livro`) é validado no service; o schema do JSONB é
  validado via Zod antes de persistir.
- Listagem com filtros múltiplos (tipo, acervo, período, idioma, status OCR) — query
  dinâmica construída com Kysely.

### 3.4 `edicao`

Uma edição específica de uma fonte (ex.: Jornal X, edição 42, 15/03/1920).

- Vinculada a uma fonte.
- Expõe status agregado de OCR calculado a partir das páginas filhas.
- Upload de imagens: controller recebe ZIP ou arquivos avulsos, service delega ao
  `IStorageAdapter` e registra as páginas com status `aguardando`. O enfileiramento
  para OCR é responsabilidade da fila de processamento — ver planejamento futuro.

### 3.5 `pagina`

Unidade mínima do acervo. Representa uma imagem digitalizada.

- Armazena: caminho da imagem original, caminhos das versões otimizadas (thumbnail,
  display), status OCR, score de confiança, dados brutos do OCR (JSONB) e `tsvector`
  para busca full-text.
- O `tsvector` é atualizado via trigger Postgres ao receber o texto do OCR.
- Reprocessamento: o service invalida o status da página para `aguardando` e registra
  uma nova entrada em `ocr_jobs`.

### 3.6 `busca`

Módulo exclusivo de leitura — não escreve nada.

- Recebe parâmetros (termo, filtros, modalidade), monta a query full-text com
  `tsvector` + `ts_headline` para snippets e retorna resultados paginados.
- As coordenadas de bounding box para highlight vêm diretamente da coluna JSONB de OCR.
- Usa a instância do Kysely injetada diretamente, sem repositório próprio.

---

## 4. Esquema do banco de dados

### Convenções
- Chaves primárias: `UUID` geradas pelo Postgres (`uuidv7()`), ordenadas no tempo.
- Timestamps: `created_at` e `updated_at` em todas as tabelas, gerenciados por trigger.
- Soft delete: coluna `deleted_at TIMESTAMPTZ` presente em todas as tabelas atuais para auditoria.
- Todas as migrations são arquivos TypeScript gerenciados pelo Kysely Migrator.

### Tabelas

```sql
-- Usuários
CREATE TYPE user_role AS ENUM ('reader', 'manager');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'reader',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

-- Coleções (Acervos)
CREATE TABLE collections (
  id           UUID PRIMARY KEY DEFAULT uuidv7(),
  name         VARCHAR(255) NOT NULL,
  description  VARCHAR(5000),
  institution  VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ DEFAULT NULL
);

-- Fontes (livros, revistas, jornais)
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  collection_id UUID REFERENCES collections(id),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('newspaper', 'magazine', 'book')),
  language      VARCHAR(50) NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

-- Edições
CREATE TABLE editions (
  id           UUID PRIMARY KEY DEFAULT uuidv7(),
  source_id    UUID NOT NULL REFERENCES sources(id),
  number       VARCHAR(50),
  published_at DATE,
  notes        VARCHAR(5000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ DEFAULT NULL
);

-- Páginas (A implementar futuramente)
CREATE TABLE paginas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id            UUID NOT NULL REFERENCES editions(id),
  numero               INTEGER NOT NULL,
  imagem_original_path TEXT NOT NULL,
  imagem_display_path  TEXT,
  imagem_thumb_path    TEXT,
  ocr_status           TEXT NOT NULL DEFAULT 'aguardando',
  ocr_confidence       NUMERIC(4,3),
  ocr_raw              JSONB,
  conteudo_tsv         TSVECTOR,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (edicao_id, numero)
);

-- Histórico de jobs de OCR (A implementar futuramente)
CREATE TABLE ocr_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id    UUID NOT NULL REFERENCES paginas(id),
  status       TEXT NOT NULL,
  tentativa    INTEGER NOT NULL DEFAULT 1,
  erro         TEXT,
  iniciado_em  TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Índices

```sql
CREATE INDEX idx_collections_name      ON collections (name);
CREATE INDEX idx_sources_collection_id ON sources (collection_id);
CREATE INDEX idx_sources_type          ON sources (type);
CREATE INDEX idx_sources_language      ON sources (language);
CREATE INDEX idx_editions_source_id    ON editions (source_id);
CREATE INDEX idx_editions_published_at ON editions (published_at);

-- Futuros (quando implementados)
CREATE INDEX paginas_tsv_idx           ON paginas USING GIN (conteudo_tsv);
CREATE INDEX paginas_edicao_idx        ON paginas (edicao_id);
CREATE INDEX paginas_status_idx        ON paginas (ocr_status);
CREATE INDEX sessions_user_id_idx      ON sessions (user_id);
```

### Trigger para tsvector (Páginas)

```sql
CREATE OR REPLACE FUNCTION atualiza_tsv() RETURNS trigger AS $$
BEGIN
  NEW.conteudo_tsv :=
    to_tsvector('portuguese', COALESCE(NEW.ocr_raw->>'full_text', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tgr_pagina_tsv
  BEFORE INSERT OR UPDATE OF ocr_raw ON paginas
  FOR EACH ROW EXECUTE FUNCTION atualiza_tsv();
```

> **Nota:** se o acervo tiver documentos em múltiplos idiomas, o dicionário do
> `to_tsvector` deve ser dinâmico, lido de `sources.language`. Manter como `'portuguese'`
> por ora e criar issue para revisão futura.

### Kysely — tipagem das tabelas

Os tipos TypeScript do banco são gerados automaticamente a partir da introspecção real do esquema pelo `kysely-codegen`. Eles ficam no arquivo [`src/infra/database/types.ts`](../src/infra/database/types.ts) e a instância do Kysely é tipada com ele (`export const db = new Kysely<DB>(...)`).

**Para regenerar os tipos (após rodar uma nova migration):**
```sh
bun run db:codegen
```
