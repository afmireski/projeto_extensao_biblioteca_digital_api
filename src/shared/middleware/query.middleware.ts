import type { RequestHandler } from 'express';
import { type ZodType, z } from 'zod';
import { ValidationError } from '../errors/app-errors';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const parsePagination = (): RequestHandler => (req, res, next) => {
  const result = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit,
  });

  if (!result.success) {
    return next(
      new ValidationError(
        'Invalid pagination parameters',
        z.flattenError(result.error),
      ),
    );
  }

  const { page, limit } = result.data;
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  next();
};

export const parseOrder =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    if (!req.query.order) {
      req.order = {};
      return next();
    }

    const result = schema.safeParse(req.query.order);
    if (!result.success) {
      return next(
        new ValidationError(
          'Invalid order parameters',
          z.flattenError(result.error),
        ),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.order = result.data as any;
    next();
  };

export const parseFilter =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    if (!req.query.filters) {
      req.filters = {};
      return next();
    }

    const result = schema.safeParse(req.query.filters);
    if (!result.success) {
      return next(
        new ValidationError(
          'Invalid filter parameters',
          z.flattenError(result.error),
        ),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.filters = result.data as any;
    next();
  };
