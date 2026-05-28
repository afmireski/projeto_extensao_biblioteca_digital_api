import { z } from 'zod';

/**
 * Zod schema for validating textual query filtering operations (eq, ne, like, in, nin).
 */
export const filterTextSchema = z
  .object({
    eq: z.string().optional(),
    ne: z.string().optional(),
    like: z.string().optional(),
    in: z.array(z.string()).optional(),
    nin: z.array(z.string()).optional(),
  })
  .optional();

/**
 * Zod schema for validating ISO date range query filtering operations (gte, lte).
 */
export const filterDateSchema = z.object({
  gte: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  lte: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * Zod schema restricting query filtering validation strictly to an equality check (eq).
 */
export const equalFilterTextSchema = z.object({
  eq: z.string().optional(),
});
