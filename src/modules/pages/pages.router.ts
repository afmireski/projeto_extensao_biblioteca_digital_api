import { Router } from 'express';
import multer from 'multer';
import { requireRoles } from '../../shared/middleware/role.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import {
  parsePagination,
  parseFilter,
  parseOrder,
} from '../../shared/middleware/query.middleware';
import {
  uploadPageSchema,
  deleteBatchSchema,
  pageFilterSchema,
  pageOrderSchema,
} from './pages.schemas';
import type { PagesController } from './pages.controller';
import type { RequestHandler } from 'express';

/**
 * Factory function to create and configure the Express router for pages.
 * Handles page uploads, listing pages, and deleting batch files.
 * @param pagesController - Controller handling page HTTP requests.
 * @param authMiddleware - Middleware handling session verification.
 * @returns Configured Express Router.
 */
export const makePagesRouter = (
  pagesController: PagesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  router.post(
    '/upload',
    authMiddleware,
    requireRoles(['manager']),
    upload.single('page'),
    validateBody(uploadPageSchema),
    pagesController.upload,
  );

  router.get(
    '/list',
    authMiddleware,
    requireRoles(['manager', 'reader']),
    parsePagination(),
    parseFilter(pageFilterSchema),
    parseOrder(pageOrderSchema),
    pagesController.list,
  );

  router.post(
    '/delete-batch',
    authMiddleware,
    requireRoles(['manager']),
    validateBody(deleteBatchSchema),
    pagesController.deleteBatch,
  );

  return router;
};
