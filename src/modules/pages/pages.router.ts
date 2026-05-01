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
  uploadBatchSchema,
  deleteBatchSchema,
  pageFilterSchema,
  pageOrderSchema,
} from './pages.schemas';
import type { PagesController } from './pages.controller';
import type { RequestHandler } from 'express';

export const makePagesRouter = (
  pagesController: PagesController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  router.post(
    '/upload-batch',
    authMiddleware,
    requireRoles(['manager']),
    upload.array('pages', 50),
    validateBody(uploadBatchSchema),
    pagesController.uploadBatch,
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
