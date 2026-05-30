import { z } from 'zod';
import { filterTextSchema } from '../../shared/schemas/query.schemas';

// HTTP schema — snake_case input at the API boundary
export const createSourceHttpSchema = z
  .object({
    collection_id: z.uuid().optional(),
    name: z.string().min(1).max(255),
    type: z.enum(['newspaper', 'magazine', 'book']),
    language: z.string().min(1).max(50),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

// Internal DTO schema — camelCase as used by the service layer
export const createSourceSchema = createSourceHttpSchema.transform((data) => ({
  collectionId: data.collection_id,
  name: data.name,
  type: data.type,
  language: data.language,
  metadata: data.metadata,
}));

// HTTP schema — snake_case input at the API boundary
export const updateSourceHttpSchema = z
  .object({
    collection_id: z.uuid().optional(),
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['newspaper', 'magazine', 'book']).optional(),
    language: z.string().min(1).max(50).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// Internal DTO schema — camelCase as used by the service layer
export const updateSourceSchema = updateSourceHttpSchema.transform((data) => ({
  collectionId: data.collection_id,
  name: data.name,
  type: data.type,
  language: data.language,
  metadata: data.metadata,
}));

export const sourceFilterSchema = z
  .object({
    name: filterTextSchema,
    type: filterTextSchema,
    language: filterTextSchema,
    collection_id: filterTextSchema,
  })
  .strict();

export const sourceOrderSchema = z.object({
  name: z.enum(['asc', 'desc']).optional(),
  type: z.enum(['asc', 'desc']).optional(),
  created_at: z.enum(['asc', 'desc']).optional(),
});
