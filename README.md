# Biblioteca Digital API

Projeto destinado à API backend do projeto de extensão da UTFPR, relacionado a uma biblioteca digital para digitalização e OCR de fontes históricas. Desenvolvido com **Bun**, **TypeScript**, **Express** e **Kysely**.

## 🚀 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- [Bun](https://bun.sh/) (v1.3+)
- [Docker](https://www.docker.com/) e Docker Compose (para rodar o banco de dados)

## 🛠️ Como configurar e rodar

**1. Instale as dependências**
```bash
bun install
```

**2. Configure as variáveis de ambiente**
Crie o seu arquivo `.env` baseado no exemplo (os valores padrões já funcionam localmente com o Docker):
```bash
cp .env.example .env
```

**3. Suba o banco de dados (PostgreSQL)**
```bash
docker compose up -d
```

**4. Execute as Migrations**
Sincronize o banco criando as tabelas necessárias:
```bash
bun run migrate:up
```

**5. Inicie a API (Desenvolvimento)**
```bash
bun run start:dev
```
*A API iniciará com hot-reload ativo. Verifique os logs no terminal para a porta utilizada (geralmente porta 3000).*

---

## 📜 Outros comandos úteis

| Comando | Descrição |
|---------|-----------|
| `bun run db:codegen` | Atualiza a tipagem do banco (`types.ts`) com base no schema atual |
| `bun run migrate:make <nome>` | Cria uma nova migration no kysely |
| `bun test` | Roda os testes unitários do projeto |
| `bun run lint` | Roda o ESLint para encontrar problemas |
| `bun run format` | Roda o Prettier para formatar os arquivos |

## 📚 Leitura obrigatória para contribuir

Antes de escrever qualquer código, **leia as diretivas do projeto e arquitetura**:
- [Diretivas de Código e Padrões (AGENTS.md)](./AGENTS.md)
- [Arquitetura do Backend (docs)](./docs/backend-architecture.md)
