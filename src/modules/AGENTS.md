# AGENTS.md — Domain Modules

This folder contains the core domain modules of the application.

## Structure

Each module is a self-contained domain following a layered architecture:

- `<module>.router.ts`: Express routes definition.
- `<module>.controller.ts`: Handles HTTP requests/responses, delegating business logic to the service.
- `<module>.service.ts`: Core business logic, independent of HTTP or database specifics. Uses dependency injection for repositories.
- `<module>.repository.port.ts`: The port interface defining the repository contract.
- `<module>.repository.ts`: The concrete implementation of the repository (e.g., using Kysely).
- `<module>.facade.ts`: The domain Facade class exposing selected functionalities for other modules to consume internally.
- `<module>.schemas.ts`: Zod validation schemas for inputs, query parameters, etc.
- `<module>.types.ts`: TypeScript interfaces and types for the domain model and DTOs.

## Rules

- **No Direct HTTP in Services**: Services must not know about `Request` or `Response`. They should return data or throw `AppError`.
- **No DB Queries in Services**: Services must strictly use repository methods. No Kysely query building in the service layer.
- **Dependency Injection**: Use Awilix for injecting dependencies into controllers and services.
- **Promise Chaining**: Prefer `.then()/.catch()` chaining over `async/await` per project conventions.
- **HTTP Boundary Naming (snake_case)**: All JSON keys in HTTP requests and responses must use `snake_case`. This applies to request bodies, query parameters, and response payloads. Internal DTOs (used inside services and repositories) may use `camelCase` (e.g., `collectionId`, `publishedAt`). The conversion from HTTP `snake_case` to internal `camelCase` is handled by a Zod `.transform()` in the schema — **not** in the controller or service.
- **Cross-Module Communication via Facades**: Domain modules must never import or depend on another module's Services or Repositories directly. Any inter-module communication must go through the target module's Facade (`<module>.facade.ts`), using Promise chaining for asynchronous operations.
- **Error Handling Standardization**: Each module must define a `<module>.error.ts` file containing domain-specific error helper functions returning instances of `AppError` subclasses. These functions must be used inside the Service layer instead of throwing raw `AppError` classes directly. Internal error codes must follow the pattern `<module>.<error_description_short>` (e.g., `users.email_conflict`, `pages.page_number_conflict`).
