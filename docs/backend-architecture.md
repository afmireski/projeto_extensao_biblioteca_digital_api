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
  `Bun.password.verify` → emite JWT assinado. `POST /auth/register` cria o usuário
  com hash gerado por `Bun.password.hash` (bcrypt por padrão no Bun).
- JWT é stateless. Para invalidação no logout, uma denylist de JTIs no Postgres é
  suficiente para o volume do projeto.
- **Repositório:** lê e escreve na tabela `users` e na `jwt_denylist`.

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
- Chaves primárias: `UUID` geradas pelo Postgres (`gen_random_uuid()`).
- Timestamps: `created_at` e `updated_at` em todas as tabelas, gerenciados por trigger.
- Soft delete: coluna `deleted_at TIMESTAMPTZ` nas tabelas com necessidade de auditoria
  (`fontes`, `edicoes`, `paginas`).
- Todas as migrations são arquivos TypeScript gerenciados pelo Kysely Migrator.

### Tabelas

```sql
-- Usuários
CREATE TYPE users_roles_enum AS ENUM ('leitor', 'gestor');

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  senha_hash  TEXT NOT NULL,
  role        users_roles_enum NOT NULL DEFAULT 'leitor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Acervos
CREATE TABLE acervos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  instituicao TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fontes (livros, revistas, jornais)
CREATE TABLE fontes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acervo_id   UUID NOT NULL REFERENCES acervos(id),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL,         -- 'jornal' | 'revista' | 'livro'
  idioma      TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',  -- campos específicos por tipo
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Edições
CREATE TABLE edicoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte_id        UUID NOT NULL REFERENCES fontes(id),
  numero          TEXT,
  data_publicacao DATE,
  observacoes     TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Páginas
CREATE TABLE paginas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id            UUID NOT NULL REFERENCES edicoes(id),
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

-- Histórico de jobs de OCR
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
CREATE INDEX paginas_tsv_idx      ON paginas USING GIN (conteudo_tsv);
CREATE INDEX paginas_edicao_idx   ON paginas (edicao_id);
CREATE INDEX paginas_status_idx   ON paginas (ocr_status);
CREATE INDEX edicoes_fonte_idx    ON edicoes (fonte_id);
CREATE INDEX fontes_acervo_idx    ON fontes (acervo_id);
CREATE INDEX fontes_tipo_idx      ON fontes (tipo);
CREATE INDEX jwt_denylist_exp_idx ON jwt_denylist (expires_at);
```

### Trigger para tsvector

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
> `to_tsvector` deve ser dinâmico, lido de `fontes.idioma`. Manter como `'portuguese'`
> por ora e criar issue para revisão futura.

### Kysely — tipagem das tabelas

O Kysely exige uma interface central que descreve o banco. Ela fica em
`src/infra/database/types.ts` e é passada como generic na instância:

```typescript
// src/infra/database/types.ts
import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface UsersTable {
  id: Generated<string>
  email: string
  nome: string
  senha_hash: string
  role: 'leitor' | 'gestor'
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

// ... demais tabelas seguem o mesmo padrão

export interface Database {
  users: UsersTable
  jwt_denylist: JwtDenylistTable
  acervos: AcervosTable
  fontes: FontesTable
  edicoes: EdicoesTable
  paginas: PaginasTable
  ocr_jobs: OcrJobsTable
}

// Tipos derivados por tabela — usar nos services e repositórios
export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>
```

```typescript
// src/infra/database/client.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})
```

### Kysely — migrations

As migrations ficam em `src/infra/database/migrations/` como arquivos TypeScript com
a interface `Migration` do Kysely (`up` e `down`). O Migrator é executado via script:

```typescript
// scripts/migrate.ts
import { Migrator, FileMigrationProvider } from 'kysely'
import { db } from '../src/infra/database/client'

const migrator = new Migrator({ db, provider: new FileMigrationProvider({ ... }) })
await migrator.migrateToLatest()
```

---

## 5. Container de DI (Awilix)

O container é configurado em `src/container.ts`. A abordagem é injeção via construtor
com `InjectionMode.CLASSIC` — sem decorators mágicos, explícito e fácil de ler para
novos desenvolvedores.

```typescript
// src/container.ts
import { createContainer, asClass, asValue, InjectionMode } from 'awilix'
import { db } from './infra/database/client'
import { LocalStorageAdapter } from './infra/storage/local.adapter'

import { AuthRepository } from './modules/auth/auth.repository'
import { AuthService } from './modules/auth/auth.service'
// ... demais imports

export function buildContainer() {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC })

  container.register({
    // Infraestrutura
    db:             asValue(db),
    storageAdapter: asClass(LocalStorageAdapter).singleton(),

    // Repositórios
    authRepository:   asClass(AuthRepository).scoped(),
    acervoRepository: asClass(AcervoRepository).scoped(),
    fonteRepository:  asClass(FonteRepository).scoped(),
    edicaoRepository: asClass(EdicaoRepository).scoped(),
    paginaRepository: asClass(PaginaRepository).scoped(),

    // Services
    authService:   asClass(AuthService).scoped(),
    acervoService: asClass(AcervoService).scoped(),
    fonteService:  asClass(FonteService).scoped(),
    edicaoService: asClass(EdicaoService).scoped(),
    paginaService: asClass(PaginaService).scoped(),
    buscaService:  asClass(BuscaService).scoped(),
  })

  return container
}
```

Cada request recebe um escopo próprio via middleware:

```typescript
// src/shared/middleware/container.middleware.ts
export function containerMiddleware(req, _res, next) {
  req.container = container.createScope()
  next()
}
```

Cada service recebe suas dependências via construtor:

```typescript
export class EdicaoService {
  constructor(
    private readonly edicaoRepository: EdicaoRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}
}
```

---

## 6. Ports e adapters nos repositórios

Cada módulo define sua própria interface de repositório (port) junto ao código de
domínio. A implementação concreta com Kysely (adapter) fica no arquivo separado.
O service depende apenas da interface — nunca da classe concreta.
As operações que um repository disponibiliza devem serem criadas a partir da necessidade do service e não o contrário. Podemos ter operações que parece, operações de banco, como findById, findAll, mas estas devem ser pensadas a partir do contexto que o service precisa. Por exemplo, em vez de termos um método sofDelete, temos um método deleteById. O propósito é o mesmo, mas, o significado, mais profundo.

```typescript
// src/modules/fonte/fonte.repository.port.ts
import type { Fonte, NewFonte, FonteUpdate, ListFontesFilter } from './fonte.types'

export interface IFonteRepository {
  findById(id: string): Promise<Fonte | undefined>
  findMany(filter: ListFontesFilter): Promise<Fonte[]>
  create(data: NewFonte): Promise<Fonte>
  update(id: string, data: FonteUpdate): Promise<Fonte>
  deleteById(id: string): Promise<void>
}
```

```typescript
// src/modules/fonte/fonte.repository.ts
import type { Kysely } from 'kysely'
import type { Database } from '../../infra/database/types'
import type { IFonteRepository } from './fonte.repository.port'
import type { Fonte, NewFonte, FonteUpdate, ListFontesFilter } from './fonte.types'

export class FonteRepository implements IFonteRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<Fonte | undefined> {
    return this.db
      .selectFrom('fontes')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }
  // ...
}
```

```typescript
// src/modules/fonte/fonte.service.ts
import type { IFonteRepository } from './fonte.repository.port'

export class FonteService {
  constructor(
    private readonly fonteRepository: IFonteRepository,  // ← depende da interface
  ) {}
}
```

O Awilix resolve o vínculo: registra a classe concreta, mas o service recebe o tipo
da interface por nome de parâmetro de construtor. Nos testes unitários, basta passar
um objeto fake que satisfaça a interface — sem banco, sem Kysely.

---

## 7. Interface de Storage (port)

```typescript
// src/infra/storage/storage.interface.ts
export interface IStorageAdapter {
  save(key: string, buffer: Buffer, mimeType: string): Promise<string>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
}
```

A implementação `LocalStorageAdapter` salva arquivos em disco e é suficiente para
desenvolvimento e ambientes simples. A troca por outra implementação (S3, MinIO, etc.)
é feita apenas em `container.ts`, sem impacto nos módulos.

---

## 8. Tratamento de erros

### Estrutura do erro

Cada erro de aplicação carrega:

- **`code`** — identificador único no formato `modulo.codigo_do_erro` (ex.:
  `auth.invalid_credentials`, `fonte.not_found`). Permite que o frontend tome decisões
  sem depender de strings de mensagem.
- **`message`** — mensagem legível por humanos.
- **`statusCode`** — código HTTP correspondente.
- **`details`** — informações adicionais estruturadas opcionais (ex.: lista de campos
  com erro de validação).
- **`debug`** — informações de diagnóstico que **nunca devem ser expostas em produção**
  (stack trace interno, query com erro, contexto da operação, etc.). O
  `error.middleware.ts` omite esse campo quando `NODE_ENV !== 'development'`.

```typescript
// src/shared/errors/app-errors.ts

export interface ErrorDetails {
  [key: string]: unknown
}

export interface DebugInfo {
  stack?: string
  cause?: unknown
  context?: Record<string, unknown>
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: ErrorDetails
  public readonly debug?: DebugInfo

  constructor(params: {
    code: string
    message: string
    statusCode: number
    details?: ErrorDetails
    debug?: DebugInfo
  }) {
    super(params.message)
    this.name = 'AppError'
    this.code = params.code
    this.statusCode = params.statusCode
    this.details = params.details
    this.debug = params.debug
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, debug?: DebugInfo) {
    super({
      code: `${resource}.not_found`,
      message: `${resource} não encontrado`,
      statusCode: 404,
      debug,
    })
  }
}

export class ForbiddenError extends AppError {
  constructor(debug?: DebugInfo) {
    super({
      code: 'auth.forbidden',
      message: 'Acesso não autorizado',
      statusCode: 403,
      debug,
    })
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'auth.unauthorized', debug?: DebugInfo) {
    super({
      code,
      message: 'Autenticação necessária',
      statusCode: 401,
      debug,
    })
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails, debug?: DebugInfo) {
    super({
      code: 'validation.invalid_input',
      message,
      statusCode: 400,
      details,
      debug,
    })
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, debug?: DebugInfo) {
    super({ code, message, statusCode: 409, debug })
  }
}

export class InternalError extends AppError {
  constructor(debug?: DebugInfo) {
    super({
      code: 'internal.unexpected_error',
      message: 'Erro interno inesperado',
      statusCode: 500,
      debug,
    })
  }
}
```

### Formato da resposta de erro

```json
{
  "error": {
    "code": "fonte.not_found",
    "message": "fonte não encontrado",
    "details": null,
    "debug": { "context": { "fonteId": "abc-123" } }
  }
}
```

O campo `debug` é omitido quando `NODE_ENV !== 'development'`.

### Middleware global

```typescript
// src/shared/middleware/error.middleware.ts
export function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
        ...(process.env.NODE_ENV === 'development' && { debug: err.debug }),
      },
    })
  }

  // Erro inesperado — não vaza detalhes em produção
  console.error(err)
  return res.status(500).json({
    error: {
      code: 'internal.unexpected_error',
      message: 'Erro interno inesperado',
      details: null,
      ...(process.env.NODE_ENV === 'development' && {
        debug: { stack: err.stack, cause: err.message },
      }),
    },
  })
}
```

---

## 9. Autenticação e controle de acesso

### Perfis

| Perfil | Como é atribuído | O que acessa |
|---|---|---|
| `leitor` | Padrão para qualquer conta nova | Busca e visualização |
| `gestor` | Atribuição manual no banco | Tudo + CRUD do acervo |

> Não há auto-cadastro de gestores via API. A promoção de um usuário a gestor é feita
> diretamente no banco por quem administra a infra.

### Middlewares

```
auth.middleware.ts   → verifica JWT, checa denylist, popula req.user; lança UnauthorizedError
role.middleware.ts   → recebe role mínimo exigido: roleGuard('gestor'); lança ForbiddenError
```

Uso nas rotas:

```typescript
router.post('/fontes', authMiddleware, roleGuard('gestor'), fonteController.create)
router.get('/fontes', fonteController.list)  // público
```

---

## 10. Endpoints principais

Todos os endpoints sob `/api/v1`.

### Auth
```
POST /auth/register    → cria conta (leitor)
POST /auth/login       → retorna JWT
POST /auth/logout      → adiciona JTI na denylist  [autenticado]
GET  /auth/me          → retorna usuário atual      [autenticado]
```

### Acervo
```
GET    /acervos
POST   /acervos                     [gestor]
GET    /acervos/:id
PATCH  /acervos/:id                 [gestor]
DELETE /acervos/:id                 [gestor]
```

### Fontes
```
GET    /fontes         ?acervo=&tipo=&idioma=&periodo_inicio=&periodo_fim=&ocr_status=
POST   /fontes                      [gestor]
GET    /fontes/:id
PATCH  /fontes/:id                  [gestor]
DELETE /fontes/:id                  [gestor]
```

### Edições
```
GET    /fontes/:fonteId/edicoes
POST   /fontes/:fonteId/edicoes     [gestor]
GET    /edicoes/:id
PATCH  /edicoes/:id                 [gestor]
DELETE /edicoes/:id                 [gestor]
POST   /edicoes/:id/upload          [gestor]  — multipart/form-data (ZIP ou avulso)
```

### Páginas
```
GET    /edicoes/:edicaoId/paginas
GET    /paginas/:id
POST   /paginas/:id/reprocessar     [gestor]
GET    /paginas/:id/imagem          → redirect para URL da imagem
```

### Busca
```
GET    /busca
  ?q=            termo ou frase ("entre aspas")
  &fonte_id=     busca num periódico específico
  &data_inicio=
  &data_fim=
  &localidade=
  &ordem=        relevancia | data
  &page=
  &limit=
```

---

## 11. Documentação da API com TypeSpec

A documentação da API é feita com **TypeSpec** — os arquivos `.tsp` em `docs/api/`
descrevem modelos e operações e geram o `openapi.yaml` como artefato de build.

### Estrutura sugerida

```
docs/api/
├── main.tsp           # imports e configuração global (@service, @server)
├── models/
│   ├── common.tsp     # Paginação, envelope de erro, tipos compartilhados
│   ├── auth.tsp
│   ├── acervo.tsp
│   ├── fonte.tsp
│   ├── edicao.tsp
│   ├── pagina.tsp
│   └── busca.tsp
└── routes/
    ├── auth.tsp
    ├── acervos.tsp
    ├── fontes.tsp
    ├── edicoes.tsp
    ├── paginas.tsp
    └── busca.tsp
```

### Exemplo de uso

```typespec
// docs/api/models/fonte.tsp
model Fonte {
  id: string;
  nome: string;
  tipo: "jornal" | "revista" | "livro";
  idioma: string;
  metadata: Record<unknown>;
  createdAt: utcDateTime;
}

model CreateFonteRequest {
  nome: string;
  tipo: "jornal" | "revista" | "livro";
  acervoId: string;
  idioma: string;
  metadata?: Record<unknown>;
}
```

```typespec
// docs/api/routes/fontes.tsp
@route("/fontes")
interface FontesRoutes {
  @get list(...ListFontesQuery): PaginatedResponse<Fonte>;
  @post create(@body body: CreateFonteRequest): Fonte;
  @get read(@path id: string): Fonte;
  @patch update(@path id: string, @body body: UpdateFonteRequest): Fonte;
  @delete remove(@path id: string): void;
}
```

O `openapi.yaml` gerado pelo TypeSpec é o contrato oficial da API. Deve ser atualizado
a cada alteração de endpoint e pode ser servido via Swagger UI no ambiente de
desenvolvimento (`/docs`).

---

## 12. Planejamento futuro

### 11.1 Integração com serviço de OCR

O módulo de OCR é desenvolvido por uma equipe separada (TCC). A integração está
**pendente de reunião de alinhamento** para definição do contrato de interface.

Pontos críticos a acordar antes de qualquer implementação:

| Ponto | Impacto |
|---|---|
| Síncrono (resposta imediata) ou assíncrono (webhook/polling)? | Muda a arquitetura da fila inteiramente |
| Coordenadas em pixels absolutos ou proporcionais (0–1)? | Afeta o cálculo de posicionamento do highlight no frontend |
| Coordenadas relativas à imagem original ou redimensionada? | Risco de destaque desalinhado |
| Segmentação por colunas disponível? | Necessário para buscas em jornais multi-coluna |
| Timeout e formato de erro retornado? | Necessário para tratar falhas de forma consistente |

Quando o contrato estiver definido, a integração se resume a implementar `IOcrAdapter`
com o cliente HTTP real, implementar `IQueue` com uma fila adequada (pg-boss é uma boa
opção — usa o próprio Postgres, sem infra adicional), e registrar os adaptadores no
`container.ts`. O restante do código não muda.

### 11.2 Análise por IA

O Figma sugere uma camada de análise de conteúdo além do OCR puro (resumo automático,
extração de entidades, resposta a perguntas). Esta feature está **fora do escopo atual**
e requer especificação própria antes de qualquer implementação. Quando especificada,
seguirá o mesmo padrão de adaptador com interface.

### 11.3 Anotações e colaboração

Comentários de usuários autenticados em páginas específicas foram identificados no
Figma, mas **não confirmados como escopo do semestre**. A tabela `anotacoes` pode ser
adicionada ao schema quando o escopo for confirmado.

### 11.4 Autenticação social (Google OAuth)

Não está no escopo atual. A estrutura de `auth` com email + senha foi projetada para
permitir a adição de providers OAuth sem alteração nos demais módulos — bastaria
adicionar a coluna `google_id` em `users` e um novo fluxo no `auth.service`.

---

## 13. Decisões técnicas e justificativas

| Decisão | Alternativa descartada | Justificativa |
|---|---|---|
| Ports e adapters nos repositórios | Repositório concreto injetado direto | Service depende de interface; troca de implementação e testes unitários sem banco ficam triviais |
| Kysely como query builder | Prisma, Drizzle, pg puro | Type-safety sem abstração excessiva; queries full-text e dinâmicas ficam legíveis; migrations em TypeScript com tipagem nativa |
| `tsvector` no Postgres | Elasticsearch | Sem infra adicional; suficiente para 50k páginas conforme requisito |
| `Bun.password` para hashing | bcryptjs, argon2 | Nativo no Bun, zero dependência extra |
| JWT + denylist no Postgres | Sessions no banco | Stateless por padrão; denylist leve para o volume do projeto |
| `JSONB` para metadados de tipo | Tabelas separadas por tipo | Evita três tabelas quase idênticas; schema validado por Zod no service |
| Awilix CLASSIC (construtor) | PROXY (proxy mágico) | Código explícito e fácil de ler para quem não conhece o Awilix |
| TypeSpec para documentação | Swagger manual, tsoa | Contrato como código-fonte; geração automática do OpenAPI; mais robusto que manter YAML à mão |
| Trigger Postgres para tsvector | Atualização no service | Garante consistência mesmo com inserções fora da API; sem lógica de indexação espalhada no backend |

---

## 14. Questões em aberto

1. **Contrato com a equipe de OCR** — síncrono ou assíncrono, formato de coordenadas,
   segmentação por colunas. Bloqueia a implementação do módulo `pagina` e da fila de
   processamento.
2. **Anotações no escopo do semestre?** — confirmar com o professor.
3. **Análise por IA no escopo do semestre?** — confirmar com o professor.
4. **Ambiente de deploy** — volume persistente para storage local ou migração para
   S3-compatible desde o início?

---

*Documento vivo — atualizar após cada reunião de alinhamento.*
