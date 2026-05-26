# Biblioteca Digital API

API backend destinada ao projeto de extensão acadêmica da UTFPR para digitalização, processamento de OCR e busca full-text em fontes históricas (jornais, revistas e livros). O sistema gerencia a ingestão de imagens de páginas de edições históricas, otimiza e armazena os arquivos de imagem, enfileira tarefas de reconhecimento de caracteres (OCR) via RabbitMQ e armazena os textos extraídos com suporte a busca textual enriquecida.

---

## 🛠️ Stack Tecnológica

O projeto foi construído utilizando as seguintes ferramentas:

*   **Runtime & Package Manager**: [Bun](https://bun.sh/) — Runtime JavaScript ultra veloz, gerenciador de dependências e test runner nativo.
*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) — Superset de JavaScript com tipagem estática segura.
*   **Servidor HTTP**: [Express 5](https://expressjs.com/) — Web framework minimalista e rápido.
*   **Query Builder**: [Kysely](https://kysely.dev/) — Construtor de queries SQL seguro para TypeScript.
*   **Banco de Dados**: [PostgreSQL 18](https://www.postgresql.org/) — Banco relacional robusto.
*   **Injeção de Dependências**: [Awilix](https://github.com/jeffijoe/awilix) — Container DI clássico baseado em resolução por nomes de construtores.
*   **Mensageria e Filas**: [RabbitMQ](https://www.rabbitmq.com/) — Broker de mensageria para processamento em segundo plano de OCR.
*   **Armazenamento de Arquivos**: [MinIO](https://min.io/) — Storage de objetos compatível com a API do AWS S3, rodando localmente no Docker para testar a infraestrutura sem depender diretamente da AWS.
*   **Logger**: [Pino](https://getpino.io/) — Logger estruturado de altíssima performance que gera outputs em JSON.
*   **Validação de Dados**: [Zod](https://zod.dev/) — Validador de schemas do TypeScript para inputs de API e metadados JSONB.

---

## 🚀 Pré-requisitos

Certifique-se de ter instalado em seu ambiente:
*   [Bun](https://bun.sh/) (v1.3+)
*   [Docker](https://www.docker.com/) e Docker Compose (para subir a infraestrutura de serviços auxiliares)

---

## ⚙️ Configuração e Inicialização

Existem duas formas de rodar a aplicação localmente: usando o setup híbrido (API rodando localmente com Bun e serviços auxiliares no Docker) ou o setup 100% Docker (API e serviços rodando inteiramente dentro do Docker).

### Opção 1: Setup Híbrido (Local com Bun + Infra no Docker)

Esta opção é a recomendada para desenvolvimento ativo da API, pois utiliza a execução nativa do Bun de forma rápida.

**1. Instale as dependências**
```bash
bun install
```

**2. Configure as variáveis de ambiente**
Crie o arquivo `.env` a partir do modelo de exemplo:
```bash
cp .env.example .env
```
*(Os valores padrão no `.env.example` já estão apontados para a infraestrutura do Docker Compose rodando em `localhost`).*

**3. Suba os serviços auxiliares (Infraestrutura)**
Inicie o banco PostgreSQL, o RabbitMQ e o MinIO no Docker:
```bash
docker compose up -d
```

**4. Execute as Migrações**
Crie a estrutura de tabelas executando as migrações:
```bash
bun run migrate:latest
```

**5. Semeie o Banco de Dados (Opcional)**
Insira dados padrão e contas de teste:
```bash
bun run db:seed
```

**6. Inicie a API localmente**
```bash
bun run start:dev
```
A API rodará na porta configurada (padrão `3000`) com hot-reload ativo.

---

### Opção 2: Setup 100% Docker (API + Infra no Docker)

Esta opção é ideal para rodar todo o ecossistema rapidamente sem precisar instalar o Bun na máquina host ou para testar em ambientes isolados.

**1. Configure as variáveis de ambiente**
Crie o arquivo `.env` a partir do modelo de exemplo:
```bash
cp .env.example .env
```

**2. Inicie todo o ecossistema**
Você pode iniciar o compose com o atalho do Bun:
```bash
bun run start:dev:docker
```
Ou rodar o comando do Docker Compose diretamente (use `-d` se preferir rodar em segundo plano):
```bash
docker compose -f docker-compose.dev.yml up
```
*(O compose está configurado para aguardar que o banco de dados, storage e filas fiquem totalmente saudáveis. Em seguida, roda automaticamente as migrações de banco, o seed de desenvolvimento e inicia a API na porta `3000`).*

**Desenvolvimento Ativo e Hot-Reload**: O `docker-compose.dev.yml` monta a pasta local `./src` como volume no container da aplicação, o que significa que qualquer alteração de código feita localmente será refletida e reiniciada instantaneamente por meio do hot-reload do Bun.

---

*Usuários padrão criados no seed (disponíveis em ambos os setups):*
*   **Gestor (Manager)**: `manager@teste.com` (senha: `senha123`)
*   **Leitor (Reader)**: `reader@teste.com` (senha: `senha123`)

---

## 📜 Scripts do Projeto

Abaixo estão listados os principais scripts definidos no `package.json` para desenvolvimento diário:

| Comando | Descrição |
| :--- | :--- |
| `bun run start:dev` | Roda o servidor HTTP em ambiente de desenvolvimento com hot-reload. |
| `bun run start:dev:docker` | Constrói a imagem da API e inicia todo o ecossistema integrado (infra + app) no Docker. |
| `bun run db:codegen` | Inspeciona o banco de dados e gera/atualiza as tipagens TypeScript das tabelas no arquivo `types.ts` via `kysely-codegen`. |
| `bun run migrate:make <nome>` | Cria um novo arquivo de migração na pasta `src/infra/database/migrations/`. |
| `bun run migrate:latest` | Executa todas as migrações pendentes no banco. |
| `bun run db:seed` | Executa o script de seed para semear dados no banco de dados. |
| `bun test` | Executa a suíte de testes unitários do projeto (ignora os testes E2E). |
| `bun run test:e2e` | Atalho que sobe a infra de testes no Docker, aplica migrações/seed no banco de testes, roda todos os testes de integração E2E e depois desliga a infra de teste. |
| `bun run lint` | Executa o linter (ESLint) para identificar problemas estáticos e formatação. |
| `bun run lint:fix` | Executa o linter corrigindo problemas estáticos automaticamente sempre que possível. |
| `bun run format` | Roda o Prettier para formatar automaticamente todos os arquivos da pasta `src/`. |
| `bun run typecheck` | Executa a verificação estática de tipos do compilador do TypeScript (`tsc --noEmit`). |

---

## 🛡️ Garantia de Qualidade e Integração Contínua (CI)

### Checklist Local Recomendado
Para manter a base de código estável e livre de bugs, execute o seguinte checklist localmente no seu terminal sempre antes de realizar commits ou enviar pull requests:

1.  **Formatador**: Formate o código com `bun run format`.
2.  **Linter**: Verifique regras estáticas com `bun run lint`.
3.  **Typecheck**: Certifique-se de que não existem erros de tipos com `bun run typecheck`.
4.  **Testes Unitários**: Execute a suíte de testes de unidade com `bun test`.
5.  **Testes End-to-End**: Teste os fluxos completos integrados com banco de testes, MinIO e RabbitMQ através do comando `bun run test:e2e`.

### Workflows Automatizados no GitHub Actions
Quando você envia código para o GitHub, o projeto executa pipelines automáticas e leves para validar a qualidade:

*   **Teste (`test.yml`)**: Dispara automaticamente a cada `push` em qualquer branch e em `pull_requests` direcionados à branch `main`. Este workflow configura o ambiente Bun, instala dependências e executa os testes unitários (`bun test`). Como os testes E2E estão ignorados por padrão no `bunfig.toml`, eles não são executados nesse workflow, mantendo a pipeline rápida e sem necessidade de provisionamento de múltiplos containers de banco/filas na nuvem.
*   **Linter (`lint.yml`)**: Dispara em `push` e `pull_requests` para a branch `main`, rodando o comando `bun run lint` para garantir a conformidade estética do código.

## 🔗 Acessos Rápidos e Utilidades

Quando a infraestrutura estiver rodando localmente (seja no Setup Híbrido ou no Setup 100% Docker), você poderá acessar os seguintes painéis e utilitários:

*   **API Principal**: `http://localhost:3000`
*   **Console do MinIO (S3 Web UI)**: [http://localhost:9001](http://localhost:9001)
    *   *Credenciais*: `minioadmin` / `minioadmin`
    *   *Uso*: Permite inspecionar visualmente os buckets de imagens (`pages-originals`, `pages-display`, `pages-thumb`).
*   **Painel do RabbitMQ (Management UI)**: [http://localhost:15672](http://localhost:15672)
    *   *Credenciais*: `guest` / `guest`
    *   *Uso*: Permite monitorar filas de mensagens, exchanges e o andamento dos processos assíncronos de OCR.

---

## 📚 Leitura Recomendada para Contribuidores

Antes de enviar qualquer código, é obrigatória a leitura atenta dos guias do projeto:
*   **[Diretivas de Código e Padrões (AGENTS.md)](file:///home/afmireski/Documentos/BCC/extensao/extensao_leandro/projeto_extensao_biblioteca_digital_api/AGENTS.md)** — Regras sobre promises encadeadas, ports/adapters, logs do Pino, nomenclatura e outros padrões.
*   **[Arquitetura do Backend (docs)](file:///home/afmireski/Documentos/BCC/extensao/extensao_leandro/projeto_extensao_biblioteca_digital_api/docs/backend-architecture.md)** — Explicação detalhada da arquitetura em camadas, modelo de banco e diagramas de domínio.
