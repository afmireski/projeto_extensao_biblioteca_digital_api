import { z } from 'zod';

export const createSourceSchema = z.object({
  collectionId: z.uuid().optional(),
  name: z.string().min(1).max(255),
  type: z.enum(['newspaper', 'magazine', 'book']),
  language: z.string().min(1).max(50),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const updateSourceSchema = z.object({
  collectionId: z.uuid().optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['newspaper', 'magazine', 'book']).optional(),
  language: z.string().min(1).max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const filterRelationTextSchema = z
  .object({
    eq: z.string().optional(),
    ne: z.string().optional(),
    like: z.string().optional(),
    in: z.array(z.string()).optional(),
    nin: z.array(z.string()).optional(),
  })
  .optional();

export const sourceFilterSchema = z.object({
  name: filterRelationTextSchema,
  type: filterRelationTextSchema,
  language: filterRelationTextSchema,
  collection_id: filterRelationTextSchema,
});

export const sourceOrderSchema = z.object({
  name: z.enum(['asc', 'desc']).optional(),
  type: z.enum(['asc', 'desc']).optional(),
  created_at: z.enum(['asc', 'desc']).optional(),
});
