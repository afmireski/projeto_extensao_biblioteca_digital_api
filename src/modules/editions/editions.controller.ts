import type { Request, Response, NextFunction } from 'express';
import type { EditionsService } from './editions.service';
import type { ListEditionsFilters } from './editions.types';

export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  create = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .createEdition(req.body)
      .then((edition) => {
        res.status(201).json(edition);
      })
      .catch(next);
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .updateEdition(req.params.id as string, req.body)
      .then((edition) => {
        res.status(200).json(edition);
      })
      .catch(next);
  };

  delete = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .deleteEdition(req.params.id as string)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  getById = (req: Request, res: Response, next: NextFunction): void => {
    this.editionsService
      .getEditionById(req.params.id as string)
      .then((edition) => {
        res.status(200).json(edition);
      })
      .catch(next);
  };

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
