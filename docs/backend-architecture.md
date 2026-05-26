# Arquitetura do Backend — Digitalizador com OCR para Fontes Históricas

**Versão:** 1.0 (Atualizada)  
**Stack:** Bun · TypeScript · Express · PostgreSQL · Kysely · Awilix · RabbitMQ · MinIO (S3)  
**Escopo:** Backend apenas

---

## 1. Visão geral da arquitetura

O backend segue uma arquitetura em camadas com módulos por domínio. Cada módulo é
autocontido: tem seu roteador, controller, service e repositório. A inversão de
dependência é feita via container Awilix, o que permite trocar implementações
(ex.: storage local → S3/MinIO) sem tocar nas regras de negócio.

```
HTTP Request
    └── Express Router
            └── Controller                   ← recebe req/res, valida entrada, chama service
                    └── Service              ← orquestração e execução de regras de negócio, depende só de interfaces (ports)
                            └── IRepository  ← port: interface definida dentro do módulo
                            │       └── Repository  ← adapter: implementação Kysely
                            └── IStorageAdapter  ← port: interface em infra/storage
                                    └── S3StorageAdapter  ← adapter: implementação S3/MinIO
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
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.error.ts
│   │   │   ├── auth.repository.port.ts    # interface IAuthRepository (Port)
│   │   │   ├── auth.repository.ts         # implementação Kysely (Adapter)
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.schemas.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.error.ts
│   │   │   ├── users.repository.port.ts   # interface IUserRepository (Port)
│   │   │   ├── users.repository.ts        # implementação Kysely (Adapter)
│   │   │   ├── users.router.ts
│   │   │   ├── users.schemas.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── sources/
│   │   │   ├── sources.controller.ts
│   │   │   ├── sources.error.ts
│   │   │   ├── sources.repository.port.ts # interface ISourcesRepository (Port)
│   │   │   ├── sources.repository.ts      # implementação Kysely (Adapter)
│   │   │   ├── sources.router.ts
│   │   │   ├── sources.schemas.ts
│   │   │   ├── sources.service.ts
│   │   │   └── sources.types.ts
│   │   │
│   │   ├── editions/
│   │   │   ├── editions.controller.ts
│   │   │   ├── editions.error.ts
│   │   │   ├── editions.repository.port.ts # interface IEditionsRepository (Port)
│   │   │   ├── editions.repository.ts      # implementação Kysely (Adapter)
│   │   │   ├── editions.router.ts
│   │   │   ├── editions.schemas.ts
│   │   │   ├── editions.service.ts
│   │   │   └── editions.types.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── pages.controller.ts
│   │   │   ├── pages.error.ts
│   │   │   ├── pages.repository.port.ts   # interface IPagesRepository (Port)
│   │   │   ├── pages.repository.ts        # implementação Kysely (Adapter)
│   │   │   ├── pages.router.ts
│   │   │   ├── pages.schemas.ts
│   │   │   ├── pages.service.ts
│   │   │   └── pages.types.ts
│   │   │
│   │   └── ocr/
│   │       ├── ocr.consumer.ts            # Consumidor de OCR (escuta a fila do RabbitMQ)
│   │       ├── ocr.error.ts
│   │       ├── ocr.facade.ts              # Facade para comunicação inter-módulos
│   │       ├── ocr.repository.port.ts     # interface IOcrRepository (Port)
│   │       ├── ocr.repository.ts          # implementação Kysely (Adapter)
│   │       ├── ocr.service.ts
│   │       └── ocr.types.ts
│   │
│   ├── infra/
│   │   ├── database/
│   │   │   ├── client.ts                  # Instância do Kysely + pool (pg)
│   │   │   ├── seed.ts                    # Script de semeadura do banco
│   │   │   ├── types.ts                   # Interfaces de banco geradas pelo kysely-codegen
│   │   │   └── migrations/                # Migrações gerenciadas pelo kysely-ctl
│   │   │
│   │   ├── image/
│   │   │   └── image.processor.ts         # Processamento e otimização de imagens (Sharp)
│   │   │
│   │   ├── ocr/
│   │   │   ├── ocr-client.interface.ts    # Interface do cliente de OCR (Port)
│   │   │   └── mock-ocr-client.ts         # Implementação mockada de OCR (Adapter)
│   │   │
│   │   ├── queue/
│   │   │   ├── queue.interface.ts         # Interface do serviço de fila (Port)
│   │   │   └── rabbitmq.service.ts        # Implementação concreta do RabbitMQ (Adapter)
│   │   │
│   │   └── storage/
│   │       ├── storage.interface.ts       # Interface de Storage (Port)
│   │       └── s3.adapter.ts              # Implementação de S3/MinIO (Adapter)
│   │
│   └── shared/
│       ├── middleware/
│       │   ├── auth.middleware.ts         # Verifica JWT, popula req.user
│       │   ├── error.middleware.ts        # Handler global de erros
│       │   ├── query.middleware.ts        # Parser e validador de paginação/filtros/ordenação
│       │   ├── role.middleware.ts         # Validação de perfil (manager / reader)
│       │   └── validate.middleware.ts     # Validador de payloads Zod
│       │
│       ├── errors/
│       │   └── app-errors.ts              # Classes de erro customizadas (AppError)
│       │
│       ├── schemas/                       # Esquemas Zod compartilhados
│       │
│       ├── services/
│       │   ├── jwt.service.port.ts        # Interface IJwtService (Port)
│       │   └── jwt.service.ts             # Implementação de JWT (jose) (Adapter)
│       │
│       └── types/
│           ├── express.d.ts               # Tipagens estendidas para Express (Request)
│           └── query.d.ts                 # Tipos genéricos de filtros e ordenação
│
├── tests/
│   ├── unit/                              # Testes unitários espelhando src/modules/
│   └── integration/                       # Testes de integração e2e
│
├── docs/
│   ├── backend-architecture.md            # Este documento de arquitetura
│   └── api/
│       ├── main.tsp                       # Entrypoint do TypeSpec
│       ├── models/                        # Modelos de dados do TypeSpec (.tsp)
│       └── routes/                        # Definições de rotas (.tsp)
│
├── .env.example
├── .env.e2e
├── bunfig.toml
├── docker-compose.yml
├── docker-compose.test.yml
├── tsconfig.json
└── package.json
```

---

## 3. Módulos — responsabilidades

### 3.1 `auth`

Gerencia a autenticação e sessões de usuários.

- **Fluxo:** `POST /api/auth/login` recebe credenciais → o service valida a senha com `Bun.password.verify` contra o hash do banco → cria uma sessão ativa na tabela `sessions` e emite um JWT contendo o ID da sessão.
- **Sessões Stateful:** O JWT atua como portador do ID da sessão. Para invalidação no logout, a sessão correspondente é removida da tabela `sessions` no Postgres (gerenciado pelo módulo `users`). Isso permite que o usuário tenha múltiplas sessões ativas (vários dispositivos).
- **Repositório:** lê e escreve na tabela `users` e na tabela `sessions`.

### 3.2 `users`

Gerencia o cadastro, perfis, senhas e encerramento de sessão de usuários.

- **Cadastro:** `POST /api/users/signup` cria um novo usuário com papel padrão `reader`, gerando o hash da senha via `Bun.password.hash` (bcrypt nativo do runtime Bun).
- **Gerenciamento de Perfil:** Permite a visualização do perfil ativo (`GET /api/users/profile`), atualização dos dados do usuário (`PATCH /api/users/update-profile`) e alteração de senha (`POST /api/users/update-password`).
- **Logout e Exclusão:** `POST /api/users/signout` encerra a sessão ativa do usuário invalidando seu token JWT (deletando a entrada correspondente da tabela `sessions`). `DELETE /api/users/delete-account` permite a exclusão lógica do usuário (soft delete) e invalidação de todas as suas sessões ativas.
- **Repositório:** lê e escreve na tabela `users` e manipula registros de `sessions`.

### 3.3 `sources`

Representa um periódico, livro ou revista dentro do sistema, opcionalmente associado a uma coleção (`collections`).

- CRUD básico com validação de permissões (apenas gestores com papel `manager` podem criar, atualizar ou remover).
- Metadados gerais + específicos por tipo estruturados e validados via esquema Zod antes de persistir em uma coluna `metadata JSONB` no Postgres.
- O `type` (`newspaper | magazine | book`) é restrito e validado pela regra de negócio e restrição do banco.
- Listagem dinâmica (`GET /api/sources/list`) permitindo filtros flexíveis (nome, tipo, idioma, coleção) e ordenação, utilizando o query builder type-safe do Kysely.

### 3.4 `editions`

Representa uma edição/fascículo específico de uma fonte (ex.: Jornal O Diário do Paraná, Edição 154, publicada em 29/03/1950).

- Vinculada obrigatoriamente a uma fonte (`source_id`).
- CRUD básico com validação de permissões de gestor para criação/edição.
- Listagem de edições associadas a uma fonte específica com ordenação e paginação.

### 3.5 `pages`

Representa uma página física digitalizada (imagem) vinculada a uma edição. É a unidade elementar de conteúdo do acervo.

- **Upload de Imagens:** O controller recebe imagens via multipart form-data (usando Multer com armazenamento em memória), otimiza-as em versões otimizadas de visualização e miniatura (thumbnail) usando a biblioteca Sharp no `ImageProcessor`, e delega o upload físico ao `S3StorageAdapter` para envio ao S3/MinIO.
- **Integração com OCR:** Ao salvar a página com sucesso (status padrão `'waiting'`), o service dispara de forma assíncrona o agendamento do processo de OCR invocando o `OcrFacade`.
- **Listagem e Remoção:** Permite listar páginas vinculadas a uma edição gerando URLs públicas temporárias de visualização a partir do S3. A remoção em lote (`POST /api/pages/delete-batch`) limpa os registros correspondentes no banco e remove fisicamente os objetos do S3/MinIO.

### 3.6 `ocr`

Módulo interno responsável pela orquestração assíncrona e processamento de reconhecimento óptico de caracteres (OCR).

- **Não expõe rotas HTTP diretamente.** A comunicação com outros módulos de domínio é feita estritamente através do `OcrFacade`.
- **Mensageria com RabbitMQ:** O `OcrService` publica mensagens de agendamento na fila do RabbitMQ. O `OcrConsumer` escuta a fila `ocr_jobs_queue`, recebe as tarefas e aciona o cliente de OCR (`MockOcrClient`) para extrair textos e bounding boxes da imagem da página.
- **Resiliência e Retentativas:** Caso ocorra falha na execução do processador de OCR, o job é reenviado para uma fila de atraso (delay exchange) do RabbitMQ para retentativa futura, tolerando até 3 tentativas antes de marcar o status do job como `FAILED` e salvar a mensagem de erro.
- **Persistência de Dados:** Registra e atualiza os históricos em `ocr_jobs` (`PENDING` -> `PROCESSING` -> `COMPLETED` | `FAILED`) e, em caso de sucesso, grava os metadados do OCR (`ocr_raw`), o score de confiança (`ocr_confidence`), e marca a página como `ocr_status = 'completed'`.

### 3.7 `collections` (futuro)

Módulo planejado para o agrupamento de múltiplas fontes (`sources`) sob um tema ou contexto comum de pesquisa.

- **Estratégia de Implementação:** Como o fluxo completo de upload de páginas, otimização de imagens e publicação na fila de processamento assíncrono de OCR era prioritário, optou-se por tornar a implementação de rotas, controladores e serviços de `collections` opcional, sendo postergada para o futuro. Atualmente, a tabela `collections` já está mapeada no esquema do banco de dados e associada opcionalmente às fontes.

---

## 4. Esquema do banco de dados

### Convenções

- Chaves primárias: `UUID` gerados pelo Postgres (`uuidv7()`), ordenados cronologicamente no tempo de inserção para otimização de índices.
- Timestamps: `created_at` e `updated_at` presentes em todas as tabelas principais, mantidos automaticamente por triggers Postgres.
- Soft delete: coluna `deleted_at TIMESTAMPTZ` para exclusão lógica e histórico.
- Migrações: arquivos puramente TypeScript gerenciados pelo Kysely Migrator.

### Tabelas

```sql
-- Definição de Perfis de Usuário
CREATE TYPE user_role AS ENUM ('reader', 'manager');

-- Definição de Status de Jobs de OCR
CREATE TYPE ocr_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Função utilitária para atualização automática do updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Usuários
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

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sessões de Usuário (Stateful)
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fontes (periódicos, livros, revistas)
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('newspaper', 'magazine', 'book')),
  language      VARCHAR(50) NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Edições
CREATE TABLE editions (
  id           UUID PRIMARY KEY DEFAULT uuidv7(),
  source_id    UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  number       VARCHAR(50),
  published_at DATE,
  notes        VARCHAR(5000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_editions_updated_at
  BEFORE UPDATE ON editions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Páginas
CREATE TABLE pages (
  id                   UUID PRIMARY KEY DEFAULT uuidv7(),
  edition_id           UUID NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  number               INTEGER NOT NULL,
  original_image_path  VARCHAR(255) NOT NULL,
  display_image_path   VARCHAR(255),
  thumb_image_path     VARCHAR(255),
  ocr_status           VARCHAR(50) NOT NULL DEFAULT 'waiting',
  ocr_confidence       NUMERIC(4,3),
  ocr_raw              JSONB,
  tsv_content          TSVECTOR,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (edition_id, number)
);

CREATE TRIGGER set_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Histórico de jobs de OCR
CREATE TABLE ocr_jobs (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  status          ocr_job_status NOT NULL,
  attempt         INTEGER NOT NULL DEFAULT 1,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_at   TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
CREATE INDEX pages_tsv_idx             ON pages USING GIN (tsv_content);
CREATE INDEX pages_edition_idx         ON pages (edition_id);
CREATE INDEX pages_status_idx          ON pages (ocr_status);
CREATE INDEX sessions_user_id_idx      ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx   ON sessions (expires_at);
CREATE INDEX idx_ocr_jobs_page_id      ON ocr_jobs (page_id);
CREATE INDEX idx_ocr_jobs_status       ON ocr_jobs (status);
```

### Trigger para tsvector (Busca Textual em Páginas)

```sql
CREATE OR REPLACE FUNCTION atualiza_tsv() RETURNS trigger AS $$
BEGIN
  NEW.tsv_content :=
    to_tsvector('portuguese', COALESCE(NEW.ocr_raw->>'full_text', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tgr_page_tsv
  BEFORE INSERT OR UPDATE OF ocr_raw ON pages
  FOR EACH ROW EXECUTE FUNCTION atualiza_tsv();
```

> **Nota:** Atualmente, a busca em texto do OCR utiliza por padrão o dicionário `'portuguese'`. Se o acervo contiver fontes em múltiplos idiomas, o dicionário da função `to_tsvector` precisará ser dinâmico, recuperando o idioma mapeado na relação `sources.language`.

### Kysely — tipagem das tabelas

Os tipos TypeScript do banco são gerados automaticamente a partir da introspecção real do esquema pelo `kysely-codegen`. Eles ficam no arquivo [`src/infra/database/types.ts`](file:///home/afmireski/Documentos/BCC/extensao/extensao_leandro/projeto_extensao_biblioteca_digital_api/src/infra/database/types.ts) e a instância do Kysely é tipada com ele (`export const db = new Kysely<DB>(...)`).

**Para regenerar os tipos (após rodar uma nova migration):**

```sh
bun run db:codegen
```
