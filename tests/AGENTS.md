# AGENTS.md — Tests

This folder contains all automated tests for the application, using the `bun:test` runner.

## Structure

- `unit/`: Unit tests isolating individual classes and functions. Grouped by module/domain.
- `integration/`: Integration tests that exercise the database and API endpoints as a whole (future).

## Unit Testing Rules

- **Mock Dependencies**: When testing a service, mock the repository. When testing a controller, mock the service. Do not use a real database or real dependencies in unit tests.
- **Isolate Layers**: The Controller tests should only assert that the controller calls the service with the right parameters and handles HTTP status codes properly. They should not re-test the business logic.
- **Promise Chaining**: When mocking functions that return Promises, use `.mockResolvedValue()` or `.mockRejectedValue()`.
- **Bun Mocking**: Use `mock()` from `bun:test` to create isolated spy/mock functions.
- **Test Setup**: Use `beforeEach` to reset state and clear mocks so tests don't leak context.
