import type { RequestHandler } from 'express';
import { type ZodType, z } from 'zod';
import { ValidationError } from '../errors/app-errors';

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
