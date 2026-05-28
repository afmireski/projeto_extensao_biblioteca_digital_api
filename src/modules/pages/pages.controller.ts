import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/app-errors';
import type { PagesService } from './pages.service';
import type { UploadFileDTO } from './pages.types';

/**
 * Controller handling HTTP endpoints for managing pages.
 * Integrates with Multer multipart middleware for image uploads.
 */
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /**
   * Handles POST /api/pages/upload to upload a new page.
   * Extracts Multer file and target edition parameters.
   * Requires manager role.
   * @param req - Express request containing files and body fields.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  upload = (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    if (!file) {
      return next(
        new ValidationError('Nenhuma imagem recebida', {
          page: 'Obrigatório',
        }),
      );
    }

    const editionId = req.body.edition_id;
    const pageNumber = req.body.number;

    const fileDTO: UploadFileDTO = {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    };

    this.pagesService
      .uploadPage(editionId, fileDTO, pageNumber)
      .then(() => {
        res.status(201).send();
      })
      .catch(next);
  };

  /**
   * Handles GET /api/pages/list to list pages with filtering/sorting.
   * @param req - Express request containing parsed filters and pagination.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  list = (req: Request, res: Response, next: NextFunction): void => {
    this.pagesService
      .list(req.filters, req.order, req.pagination)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch(next);
  };

  /**
   * Handles POST /api/pages/delete-batch to remove multiple pages in bulk.
   * Requires manager role.
   * @param req - Express request with list of page UUIDs.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  deleteBatch = (req: Request, res: Response, next: NextFunction): void => {
    const { page_ids } = req.body;
    this.pagesService
      .deleteBatch(page_ids)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };
}
