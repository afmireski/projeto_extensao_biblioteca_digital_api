# AGENTS.md — API Documentation (TypeSpec)

This folder contains the API documentation source files written in [TypeSpec](https://typespec.io/), which are then compiled into standard OpenAPI v3 specifications.

## Structure
- `main.tsp`: The entry point for the compiler. Imports all other `.tsp` files and defines global server settings (title, version, security schemes).
- `models/`: Type definitions for request/response payloads (e.g., `user.tsp`, `edition.tsp`). Keep DTOs here.
- `routes/`: Endpoint definitions (e.g., `users.tsp`, `editions.tsp`).
- `openapi.yaml`: The auto-generated output (DO NOT EDIT MANUALLY).

## Rules
- **Never Edit `openapi.yaml` Directly**: Always edit the corresponding `.tsp` files and run the compiler.
- **Interfaces for Routes**: Wrap your API operations inside an `interface` block annotated with `@route` and `@tag`. Avoid using `namespace` for the route container, as it may not map properly in the generated OpenAPI file.
- **Namespaces**: Use a global namespace (e.g., `namespace BibliotecaDigital;`) at the top of your files to avoid polluting the global TypeSpec scope.
- **Compilation**: After any changes, compile the spec using:
  ```bash
  bun run docs:compile
  ```
- **Error Types**: Standardize error responses using the shared `ErrorResponse` model defined in `main.tsp` or a shared model file.
