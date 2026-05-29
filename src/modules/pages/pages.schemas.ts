import { z } from 'zod';

export const uploadPageSchema = z.object({
  edition_id: z.uuid('ID da edição inválido'),
  number: z.coerce
    .number()
    .int()
    .min(1, 'O número da página deve ser pelo menos 1'),
});

export const deleteBatchSchema = z.object({
  page_ids: z
    .array(z.uuid('ID da página inválido'))
    .min(1, 'Nenhuma página fornecida'),
});

export const pageFilterSchema = z.object({
  edition_id: z.object({
    eq: z.uuid('ID da edição inválido'),
  }),
});

export const pageOrderSchema = z.object({
  number: z.enum(['asc', 'desc']).optional(),
});
