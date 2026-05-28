import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger';
import { AppError } from '../errors/app-errors';

/**
 * Centralized Express error-handling middleware.
 * Intercepts thrown instances of AppError and formats them into standardized JSON error responses.
 * Logs internal errors and formats generic/unhandled exceptions as server errors.
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    if (err.debug) {
      logger.error({ err, debug: err.debug }, 'AppError thrown');
    } else if (err.statusCode >= 500) {
      logger.error({ err }, 'Internal AppError thrown');
    }

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    code: 'server.internal_error',
    message: 'Internal server error',
  });
};
