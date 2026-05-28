import type { Request, Response, NextFunction } from 'express';
import type { SourcesService } from './sources.service';

/**
 * Controller handling HTTP requests for document sources.
 * Maps Express routes to the SourcesService.
 */
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  /**
   * Handles POST /api/sources/create to create a new source.
   * Requires manager role.
   * @param req - Express request containing the source body.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  create = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .createSource(req.body)
      .then((source) => {
        res.status(201).json(source);
      })
      .catch(next);
  };

  /**
   * Handles PATCH /api/sources/:id/update to update a source's metadata.
   * Requires manager role.
   * @param req - Express request containing params ID and body updates.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  update = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .updateSource(req.params.id as string, req.body)
      .then((source) => {
        res.status(200).json(source);
      })
      .catch(next);
  };

  /**
   * Handles DELETE /api/sources/:id/delete to soft-delete a source.
   * Requires manager role.
   * @param req - Express request containing source ID param.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  delete = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .deleteSource(req.params.id as string)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  /**
   * Handles GET /api/sources/:id to retrieve a source by its ID.
   * @param req - Express request containing source ID param.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  getById = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .getSourceById(req.params.id as string)
      .then((source) => {
        res.status(200).json(source);
      })
      .catch(next);
  };

  /**
   * Handles GET /api/sources/list to retrieve a filtered, ordered, and paginated list of sources.
   * @param req - Express request containing parsed filters, order, and pagination params.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  list = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .listSources(req.filters, req.order, req.pagination)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}
