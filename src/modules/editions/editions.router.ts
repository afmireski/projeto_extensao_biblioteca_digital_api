import { Router } from 'express';
import type { RequestHandler } from 'express';
import { EditionsController } from './editions.controller';
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
  createEditionSchema,
  updateEditionSchema,
  editionFilterSchema,
  editionOrderSchema,
} from './editions.schemas';
import { z } from 'zod';

const paramIdSchema = z.object({ id: z.uuid() });

/**
 * Factory function to create and configure the Express router for source editions.
 * Sets up endpoints for creation, updates, soft deletion, details, and list.
 * @param editionsController - Controller handling edition HTTP request routing.
 * @param authMiddleware - Middleware handling session verification.
 * @returns Configured Express Router.
 */
export const makeEditionsRouter = (
  editionsController: EditionsController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.post(
    '/create',
    authMiddleware,
    requireRoles(['manager']),
    validateBody(createEditionSchema),
    editionsController.create,
  );

  router.patch(
    '/:id/update',
    authMiddleware,
    requireRoles(['manager']),
    validateParams(paramIdSchema),
    validateBody(updateEditionSchema),
    editionsController.update,
  );

  router.delete(
    '/:id/delete',
    authMiddleware,
    requireRoles(['manager']),
    validateParams(paramIdSchema),
    editionsController.delete,
  );

  router.get(
    '/list',
    authMiddleware,
    requireRoles(['manager', 'reader']),
    parsePagination(),
    parseFilter(editionFilterSchema),
    parseOrder(editionOrderSchema),
    editionsController.list,
  );

  router.get(
    '/:id',
    authMiddleware,
    requireRoles(['manager', 'reader']),
    validateParams(paramIdSchema),
    editionsController.getById,
  );

  return router;
};
