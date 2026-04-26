import { Router } from 'express';
import type { RequestHandler } from 'express';
import { SourcesController } from './sources.controller';
import {
  validateBody,
  validateParams,
} from '../../shared/middleware/validate.middleware';
import { requireRoles } from '../../shared/middleware/role.middleware';
import {
  parsePagination,
  parseFilter,
  parseOrder,
} from '../../shared/middleware/query.middleware';
import {
  createSourceSchema,
  updateSourceSchema,
  sourceFilterSchema,
  sourceOrderSchema,
} from './sources.schemas';
import { z } from 'zod';

const paramIdSchema = z.object({ id: z.string().uuid() });

export const makeSourcesRouter = (
  sourcesController: SourcesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.post(
    '/create',
    authMiddleware,
    requireRoles(['manager']),
    validateBody(createSourceSchema),
    sourcesController.create,
  );

  router.patch(
    '/:id/update',
    authMiddleware,
    requireRoles(['manager']),
    validateParams(paramIdSchema),
    validateBody(updateSourceSchema),
    sourcesController.update,
  );

  router.delete(
    '/:id/delete',
    authMiddleware,
    requireRoles(['manager']),
    validateParams(paramIdSchema),
    sourcesController.delete,
  );

  router.get(
    '/list',
    authMiddleware,
    parsePagination(),
    parseFilter(sourceFilterSchema),
    parseOrder(sourceOrderSchema),
    sourcesController.list,
  );

  router.get(
    '/:id',
    authMiddleware,
    validateParams(paramIdSchema),
    sourcesController.getById,
  );

  return router;
};
