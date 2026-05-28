/**
 * Base abstract class for all application-specific errors.
 * Formats error responses and standardizes client error representations.
 */
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details?: unknown;
  public readonly debug?: unknown;

  /**
   * Initializes a new instance of AppError.
   * @param message - User-facing error message description.
   * @param details - Optional details describing input validation errors or specific issues.
   * @param debug - Optional context/logs to debug the error internally, never serialized to HTTP responses.
   */
  constructor(message: string, details?: unknown, debug?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.debug = debug;
  }
}

/**
 * Error thrown when a requested resource is not found (HTTP 404).
 */
export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code: string;

  /**
   * Initializes a new instance of NotFoundError.
   * @param resource - Name of the resource that was not found.
   * @param debug - Internal debug information.
   * @param code - Error code identifier.
   */
  constructor(resource: string, debug?: unknown, code = 'resource.not_found') {
    super(`Resource '${resource}' not found`, undefined, debug);
    this.code = code;
  }
}

/**
 * Error thrown when request validation fails (HTTP 400).
 */
export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code: string;

  /**
   * Initializes a new instance of ValidationError.
   * @param message - Error description.
   * @param details - Specific schema failure details.
   * @param debug - Internal debug information.
   * @param code - Error code identifier.
   */
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

/**
 * Error thrown when credentials/token are missing or invalid (HTTP 401).
 */
export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code: string;

  /**
   * Initializes a new instance of UnauthorizedError.
   * @param message - Error description.
   * @param debug - Internal debug information.
   * @param code - Error code identifier.
   */
  constructor(
    message = 'Unauthorized',
    debug?: unknown,
    code = 'auth.unauthorized',
  ) {
    super(message, undefined, debug);
    this.code = code;
  }
}

/**
 * Error thrown when permissions are insufficient for the request (HTTP 403).
 */
export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code: string;

  /**
   * Initializes a new instance of ForbiddenError.
   * @param message - Error description.
   * @param debug - Internal debug information.
   * @param code - Error code identifier.
   */
  constructor(message = 'Forbidden', debug?: unknown, code = 'auth.forbidden') {
    super(message, undefined, debug);
    this.code = code;
  }
}

/**
 * Error thrown when a business rule conflict occurs (HTTP 409).
 */
export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code: string;

  /**
   * Initializes a new instance of ConflictError.
   * @param code - Error code identifier indicating the domain conflict.
   * @param message - User-facing conflict description.
   * @param debug - Internal debug information.
   */
  constructor(code: string, message: string, debug?: unknown) {
    super(message, undefined, debug);
    this.code = code;
  }
}

/**
 * Error thrown for unexpected server failures (HTTP 500).
 */
export class InternalError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'server.internal_error';

  /**
   * Initializes a new instance of InternalError.
   * @param debug - Internal debug information or underlying error stack/cause.
   */
  constructor(debug?: unknown) {
    super('Internal server error', undefined, debug);
  }
}
