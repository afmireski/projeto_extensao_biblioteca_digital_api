# AGENTS.md — Shared Utilities

This folder contains shared code that is agnostic to specific domains (modules).

## Structure

- `errors/`: Custom `AppError` subclasses (`NotFoundError`, `ValidationError`, etc.) and the centralized error map for HTTP mapping.
- `middleware/`: Express middleware for authentication, authorization (roles), validation (Zod), and query parsing.
- `services/`: Shared services (e.g., JWT Service, Mail Service) that are used across multiple modules.
- `types/`: Common types used throughout the app (e.g., query pagination/filter interfaces).
- `schemas/`: Common Zod schemas (e.g., `query.schemas.ts` for filtering text/dates).
- `logger.ts`: The global Pino logger instance.

## Rules

- **No Domain Logic**: Shared code must not depend on or import from `src/modules/*`. If it does, it's not truly shared and should probably belong to a specific module.
- **Error Handling**: Always use the predefined `AppError` subclasses from `shared/errors/` instead of generic JS `Error`s. Let the `error.middleware.ts` handle translating them to standard HTTP responses.
- **Logging**: Use `logger` exported from `shared/logger.ts`. Do not use `console.log()`. Structure logs appropriately: `logger.info({ contextKey: 'value' }, 'Message')`.

## Schema Pattern — HTTP snake_case vs. Internal camelCase

All JSON keys at the HTTP boundary must be `snake_case`. Internal DTOs (used by services/repositories) use `camelCase`. The schemas in `shared/schemas/` follow the same convention.

When a request body or query parameter has compound words, define two schemas:

1. **HTTP schema** (`*HttpSchema`): accepts `snake_case` keys (e.g., `source_id`, `published_at`).
2. **Internal schema** (the exported `*Schema`): wraps the HTTP schema with a `.transform()` that converts to the `camelCase` DTO (e.g., `sourceId`, `publishedAt`).

The `validateBody` middleware runs the schema and overwrites `req.body` with the transformed output, so the controller and service always see `camelCase` internally.
