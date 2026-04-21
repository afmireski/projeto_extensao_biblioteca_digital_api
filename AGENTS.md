# AGENTS.md — Diretivas do Projeto

Documento de referência para agentes de IA, novos colaboradores e qualquer pessoa
que vá contribuir com código neste projeto. Leia antes de escrever qualquer linha.

---

## 1. Visão geral

API backend de uma **biblioteca digital** para digitalização e OCR de fontes históricas
(jornais, revistas, livros). Projeto acadêmico de extensão da UTFPR.

O sistema permite que gestores ingiram documentos digitalizados (imagens), os associem
a acervos e edições, e que os resultados de OCR sejam consultados via busca full-text.

---

## 2. Stack e ferramentas

| Ferramenta | Papel |
|---|---|
| **Bun 1.3.13** | Runtime, package manager, test runner, bcrypt nativo |
| **TypeScript** | Linguagem única — sem JavaScript puro no `src/` |
| **Express 5** | Servidor HTTP |
| **Kysely** | Query builder type-safe para Postgres |
| **kysely-ctl** | CLI de migrations do Kysely |
| **Awilix** | Container de injeção de dependências |
| **Zod** | Validação de schemas (inputs HTTP, metadados JSONB) |
| **Pino** | Logger estruturado JSON |
| **jose** | JWT — assinar e verificar tokens |
| **PostgreSQL 18** | Banco de dados principal |

---

## 3. Estilo de código — Encadeamento de Promises ⚠️

**Este projeto usa encadeamento de promises como estilo padrão.**
`async/await` não é o estilo preferido e deve ser **evitado**, salvo em casos
excepcionais devidamente justificados em comentário no código.

### ✅ Correto — encadeamento

```typescript
fonteRepository
  .findById(id)
  .then((fonte) => {
    if (!fonte) throw new NotFoundError('fonte')
    return fonte
  })
  .catch((err) => {
    if (err instanceof AppError) throw err
    throw new InternalError({ cause: err })
  })
```

### ❌ Evitar — async/await

```typescript
// Não use este estilo salvo exceção justificada
async function handle(id: string) {
  const fonte = await fonteRepository.findById(id)
  if (!fonte) throw new NotFoundError('fonte')
  return fonte
}
```

### Regra para Promise.all

Use `Promise.all` para operações paralelas independentes — não encadeie chamadas
que não dependem uma da outra:

```typescript
Promise.all([fonteRepository.findById(id), acervoRepository.findById(acervoId)])
  .then(([fonte, acervo]) => { /* ... */ })
```

---

## 4. Arquitetura em camadas

```
HTTP → Controller → Service → Repository → Banco
```

**Nenhuma camada pula outra.**

- Controller recebe `req`/`res`, valida entrada, chama o Service, devolve resposta HTTP.
- Service contém toda a lógica de negócio. Não sabe nada de HTTP nem de Kysely.
- Repository acessa o banco. Não contém lógica de negócio.

Se você está escrevendo uma query Kysely em um Service, algo está errado.
Se você está lendo `req.body` em um Service, algo está errado.

---

## 5. Ports & Adapters nos repositórios

Cada módulo define sua **interface de repositório** (port) em `*.repository.port.ts`.
A implementação concreta com Kysely (adapter) fica em `*.repository.ts`.

Services **sempre dependem da interface**, nunca da classe concreta:

```typescript
// ✅ Correto
export class FonteService {
  constructor(private readonly fonteRepository: IFonteRepository) {}
}

// ❌ Errado — dependência da classe concreta
export class FonteService {
  constructor(private readonly fonteRepository: FonteRepository) {}
}
```

Isso garante que testes unitários não precisam de banco — basta um objeto que satisfaça
a interface.

---

## 6. Nomenclatura de repositórios

Os métodos de repositório são nomeados pela **intenção do domínio**, não pela operação
de banco de dados. O que importa é o _por quê_, não o _como_.

| ✅ Use | ❌ Evite | Motivo |
|---|---|---|
| `deleteById(id)` | `softDelete(id)` | A implementação é detalhe; o domínio quer deletar |
| `findManyByAcervo(acervoId)` | `selectWhereAcervoId(acervoId)` | Intenção clara |
| `markAsProcessing(id)` | `updateStatus(id, 'processando')` | Semântica de domínio |

**Não crie métodos de repositório que o Service não pediu.** A interface nasce da
necessidade do Service, não de uma visão de "CRUD completo".

---

## 7. Container de DI — Awilix CLASSIC

O container usa `InjectionMode.CLASSIC` — injeção **via construtor**, explícita.
Não use decorators mágicos nem `PROXY` mode.

```typescript
// ✅ Correto — construtor explícito
export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: IJwtService,
  ) {}
}
```

O Awilix resolve pelo **nome do parâmetro do construtor**. O nome do parâmetro deve
bater exatamente com a chave registrada no container em `src/container.ts`.

---

## 8. Logger — Pino obrigatório

**`console.log`, `console.warn`, `console.error` são proibidos no código da aplicação.**

Use sempre o logger do Pino exportado de `src/shared/logger.ts`:

```typescript
import { logger } from '../../shared/logger'

logger.info({ fonteId: id }, 'Fonte encontrada')
logger.error({ err, fonteId: id }, 'Falha ao buscar fonte')
```

Estruture os logs com **campos de contexto como primeiro argumento** (objeto),
e a mensagem como segundo. Nunca concatene strings na mensagem de log.

---

## 9. Tratamento de erros — AppError

**Nunca lance `new Error(...)` genérico** no código da aplicação.

Use as classes de `src/shared/errors/app-errors.ts`:

| Classe | Quando usar |
|---|---|
| `NotFoundError(resource)` | Recurso não encontrado (404) |
| `ValidationError(msg, details)` | Entrada inválida (400) |
| `UnauthorizedError()` | Token ausente ou inválido (401) |
| `ForbiddenError()` | Autenticado mas sem permissão (403) |
| `ConflictError(code, msg)` | Conflito de estado (409) |
| `InternalError(debug)` | Erros inesperados — sempre com `debug` |

O middleware global `error.middleware.ts` intercepta todos os `AppError` e os
serializa no formato padrão da API.

---

## 10. UUID v7 — gerado pelo Postgres

As chaves primárias são **UUID v7 gerados pelo Postgres** via `gen_random_uuidv7()`,
disponível nativamente no PostgreSQL 18 sem extensão.

**Não gere UUIDs no código da aplicação.** Não use `crypto.randomUUID()` para PKs.
O banco é a fonte de verdade para identificadores.

```sql
-- Padrão em todas as migrations
id UUID PRIMARY KEY DEFAULT gen_random_uuidv7()
```

UUID v7 é ordenado por tempo de inserção, o que melhora a performance de índices
B-tree em comparação ao UUID v4 aleatório.

---

## 11. Bun nativo — bcrypt sem dependência

Para hash e verificação de senhas, use **exclusivamente**:

```typescript
// Hash
Bun.password.hash(plainText)           // bcrypt por padrão
// Verificação
Bun.password.verify(plainText, hash)
```

**Não instale** `bcryptjs`, `bcrypt`, `argon2` ou similares. Está disponível no
runtime sem custo adicional.

---

## 12. Migrations — kysely-ctl exclusivamente

Toda alteração de schema passa por uma migration gerenciada pelo `kysely-ctl`.

```sh
bun run migrate:make nome-da-migration   # cria o arquivo
bun run migrate:up                       # aplica pendentes
bun run migrate:down                     # reverte a última
bun run migrate:status                   # lista o estado
```

- Migrations ficam em `src/infra/database/migrations/`
- Cada arquivo exporta `up` e `down` (interface `Migration` do Kysely)
- **Nunca altere uma migration já commitada** — crie uma nova
- PKs sempre com `DEFAULT gen_random_uuidv7()`
- Timestamps com `DEFAULT now()` e trigger de `updated_at`

---

## 13. Estrutura de módulos

Cada módulo em `src/modules/<nome>/` é autocontido:

```
<modulo>/
  <modulo>.router.ts          # Express Router — monta as rotas
  <modulo>.controller.ts      # Recebe req/res, delega ao service
  <modulo>.service.ts         # Lógica de negócio
  <modulo>.repository.port.ts # Interface IXxxRepository (port)
  <modulo>.repository.ts      # Implementação Kysely (adapter)
  <modulo>.types.ts           # Tipos específicos do módulo
```

O módulo `busca` é exceção: não tem repositório próprio — usa a instância `db`
injetada diretamente (leitura full-text via tsvector).

---

*Documento vivo — atualizar conforme novas decisões forem tomadas.*
