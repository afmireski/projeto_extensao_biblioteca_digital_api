import { z } from 'zod';
import {
  filterTextSchema,
  filterDateSchema,
} from '../../shared/schemas/query.schemas';

// HTTP schema — snake_case input at the API boundary
export const createEditionHttpSchema = z.object({
  source_id: z.uuid(),
  number: z.string().min(1).max(50).optional(),
  published_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'published_at must be in YYYY-MM-DD format')
    .optional(),
  notes: z.string().min(1).max(5000).optional(),
});

// Internal DTO schema — camelCase as used by the service layer
export const createEditionSchema = createEditionHttpSchema.transform(
  (data) => ({
    sourceId: data.source_id,
    number: data.number,
    publishedAt: data.published_at,
    notes: data.notes,
  }),
);

// HTTP schema — snake_case input at the API boundary
export const updateEditionHttpSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  published_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'published_at must be in YYYY-MM-DD format')
    .optional(),
  notes: z.string().min(1).max(5000).optional(),
});

// Internal DTO schema — camelCase as used by the service layer
export const updateEditionSchema = updateEditionHttpSchema.transform(
  (data) => ({
    number: data.number,
    publishedAt: data.published_at,
    notes: data.notes,
  }),
);

export const editionFilterSchema = z.object({
  number: filterTextSchema,
  published_at: filterDateSchema,
  source_name: filterTextSchema,
  source_type: filterTextSchema,
  source_language: filterTextSchema,
});

export const editionOrderSchema = z.object({
  number: z.enum(['asc', 'desc']).optional(),
  published_at: z.enum(['asc', 'desc']).optional(),
  created_at: z.enum(['asc', 'desc']).optional(),
});
