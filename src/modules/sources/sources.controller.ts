import type { Request, Response, NextFunction } from 'express';
import type { SourcesService } from './sources.service';

export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  create = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .createSource(req.body)
      .then((source) => {
        res.status(201).json(source);
      })
      .catch(next);
  };

  update = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .updateSource(req.params.id as string, req.body)
      .then((source) => {
        res.status(200).json(source);
      })
      .catch(next);
  };

  delete = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .deleteSource(req.params.id as string)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  getById = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .getSourceById(req.params.id as string)
      .then((source) => {
        res.status(200).json(source);
      })
      .catch(next);
  };

  list = (req: Request, res: Response, next: NextFunction): void => {
    this.sourcesService
      .listSources(req.filters, req.order, req.pagination)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}
