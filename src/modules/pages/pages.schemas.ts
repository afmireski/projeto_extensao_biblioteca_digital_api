import { z } from 'zod';

export const uploadBatchSchema = z.object({
  edition_id: z.uuid('ID da edição inválido'),
  starting_number: z.coerce
    .number()
    .int()
    .min(1, 'O número inicial deve ser pelo menos 1'),
});

export const deleteBatchSchema = z.object({
  page_ids: z
    .array(z.uuid('ID da página inválido'))
    .min(1, 'Nenhuma página fornecida'),
});

export const pageFilterSchema = z.object({
  edition_id: z
    .union([
      z.uuid(),
      z.object({
        eq: z.uuid().optional(),
        in: z.array(z.uuid()).optional(),
      }),
    ])
    .optional(),
});

export const pageOrderSchema = z.object({
  number: z.enum(['asc', 'desc']).optional(),
});
