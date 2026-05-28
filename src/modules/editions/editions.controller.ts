import type { Request, Response, NextFunction } from 'express';
import type { EditionsService } from './editions.service';
import type { ListEditionsFilters } from './editions.types';

/**
 * Controller handling HTTP requests for document editions.
 * Maps Express routes to the EditionsService.
 */
export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  /**
   * Handles POST /api/editions/create to create a new source edition.
   * Requires manager role.
   * @param req - Express request containing creation body.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  create = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .createEdition(req.body)
      .then((edition) => {
        res.status(201).json(edition);
      })
      .catch(next);
  };

  /**
   * Handles PATCH /api/editions/:id/update to update edition details.
   * Requires manager role.
   * @param req - Express request with params ID and body updates.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  update = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .updateEdition(req.params.id as string, req.body)
      .then((edition) => {
        res.status(200).json(edition);
      })
      .catch(next);
  };

  /**
   * Handles DELETE /api/editions/:id/delete to soft-delete an edition.
   * Requires manager role.
   * @param req - Express request containing params edition ID.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  delete = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .deleteEdition(req.params.id as string)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  /**
   * Handles GET /api/editions/:id to fetch a single edition by ID.
   * @param req - Express request with params edition ID.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  getById = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .getEditionById(req.params.id as string)
      .then((edition) => {
        res.status(200).json(edition);
      })
      .catch(next);
  };

  /**
   * Handles GET /api/editions/list to list source editions with search filters.
   * @param req - Express request containing parsed filters, order, and pagination params.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  list = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .listEditions(
        req.filters as unknown as ListEditionsFilters,
        req.order,
        req.pagination,
      )
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}
