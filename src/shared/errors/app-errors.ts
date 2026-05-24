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
  public readonly code: string;

  constructor(resource: string, debug?: unknown, code = 'resource.not_found') {
    super(`Resource '${resource}' not found`, undefined, debug);
    this.code = code;
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code: string;

  constructor(
    message: string,
    details?: unknown,
    debug?: unknown,
    code = 'input.validation_error',
  ) {
    super(message, details, debug);
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code: string;

  constructor(
    message = 'Unauthorized',
    debug?: unknown,
    code = 'auth.unauthorized',
  ) {
    super(message, undefined, debug);
    this.code = code;
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code: string;

  constructor(message = 'Forbidden', debug?: unknown, code = 'auth.forbidden') {
    super(message, undefined, debug);
    this.code = code;
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
