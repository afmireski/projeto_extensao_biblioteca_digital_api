import type { RequestHandler } from 'express';
import { type ZodType, z } from 'zod';
import { ValidationError } from '../errors/app-errors';

/**
 * Middleware factory that validates the request body using a Zod schema.
 * Replaces req.body with the parsed/validated data or passes a ValidationError to next().
 * @param schema - The Zod schema to validate the request body against.
 * @returns Express RequestHandler middleware.
 */
export const validateBody =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ValidationError(
          'Invalid request body',
          z.flattenError(result.error),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };

/**
 * Middleware factory that validates the request query parameters using a Zod schema.
 * Replaces req.query with the parsed/validated data or passes a ValidationError to next().
 * @param schema - The Zod schema to validate the query parameters against.
 * @returns Express RequestHandler middleware.
 */
export const validateQuery =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new ValidationError(
          'Invalid request query',
          z.flattenError(result.error),
        ),
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.query = result.data as any;
    next();
  };

/**
 * Middleware factory that validates the request URL path parameters using a Zod schema.
 * Replaces req.params with the parsed/validated data or passes a ValidationError to next().
 * @param schema - The Zod schema to validate the path parameters against.
 * @returns Express RequestHandler middleware.
 */
export const validateParams =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        new ValidationError(
          'Invalid request parameters',
          z.flattenError(result.error),
        ),
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.params = result.data as any;
    next();
  };
