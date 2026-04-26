export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details?: unknown;
  public readonly debug?: unknown;

  constructor(message: string, details?: unknown, debug?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.debug = debug;
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'resource.not_found';

  constructor(resource: string, debug?: unknown) {
    super(`Resource '${resource}' not found`, undefined, debug);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'input.validation_error';

  constructor(message: string, details?: unknown, debug?: unknown) {
    super(message, details, debug);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'auth.unauthorized';

  constructor(message = 'Unauthorized', debug?: unknown) {
    super(message, undefined, debug);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'auth.forbidden';

  constructor(message = 'Forbidden', debug?: unknown) {
    super(message, undefined, debug);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code: string;

  constructor(code: string, message: string, debug?: unknown) {
    super(message, undefined, debug);
    this.code = code;
  }
}

export class InternalError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'server.internal_error';

  constructor(debug?: unknown) {
    super('Internal server error', undefined, debug);
  }
}
