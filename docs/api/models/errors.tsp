using TypeSpec.Http;

namespace BibliotecaDigital;

/** Bad Request / Validation Error */
model ValidationErrorResponse {
  code: "input.validation_error" | string;
  message: string;
  details?: Record<unknown>;
}

/** Unauthorized Error */
model UnauthorizedErrorResponse {
  code: "auth.unauthorized" | string;
  message: string;
}

/** Forbidden Error */
model ForbiddenErrorResponse {
  code: "auth.forbidden" | string;
  message: string;
}

/** Not Found Error */
model NotFoundErrorResponse {
  code: "resource.not_found" | string;
  message: string;
}

/** Conflict Error */
model ConflictErrorResponse {
  code: string;
  message: string;
}

/** Internal Server Error */
model InternalErrorResponse {
  code: "server.internal_error";
  message: string;
}
