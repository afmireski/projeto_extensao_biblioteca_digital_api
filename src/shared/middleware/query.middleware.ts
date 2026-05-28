import type { RequestHandler } from 'express';
import { type ZodType, z } from 'zod';
import { ValidationError } from '../errors/app-errors';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Middleware factory that parses and validates page/limit query parameters.
 * Sets `req.pagination` with the page, limit, and calculated offset.
 * Throws ValidationError if the parameters are invalid.
 */
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

/**
 * Middleware factory that parses the query 'order' parameter.
 * Supports query objects or raw JSON strings and validates them against the provided Zod schema.
 * Sets `req.order` with the validated sorting data.
 */
export const parseOrder =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    if (!req.query.order) {
      req.order = {};
      return next();
    }

    let orderData = req.query.order;
    if (typeof orderData === 'string') {
      try {
        orderData = JSON.parse(orderData);
      } catch (err) {
        // If JSON.parse fails, let Zod catch the validation error
      }
    }

    const result = schema.safeParse(orderData);
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

/**
 * Middleware factory that parses query search 'filters'.
 * Supports nested query objects or raw JSON strings and validates them against the provided Zod schema.
 * Sets `req.filters` with the validated criteria.
 */
export const parseFilter =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req, res, next) => {
    if (!req.query.filters) {
      req.filters = {};
      return next();
    }

    let filterData = req.query.filters;
    if (typeof filterData === 'string') {
      try {
        filterData = JSON.parse(filterData);
      } catch (err) {
        // If JSON.parse fails, let Zod catch the validation error
      }
    }

    const result = schema.safeParse(filterData);
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
