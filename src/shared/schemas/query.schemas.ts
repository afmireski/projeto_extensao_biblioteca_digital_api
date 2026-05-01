import { z } from 'zod';

export const filterTextSchema = z
  .object({
    eq: z.string().optional(),
    ne: z.string().optional(),
    like: z.string().optional(),
    in: z.array(z.string()).optional(),
    nin: z.array(z.string()).optional(),
  })
  .optional();

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
export const equalFilterTextSchema = z.object({
  eq: z.string().optional(),
});
