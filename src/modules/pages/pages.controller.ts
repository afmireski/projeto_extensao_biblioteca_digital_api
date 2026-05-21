import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/app-errors';
import type { PagesService } from './pages.service';
import type { UploadFileDTO } from './pages.types';

export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

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

  list = (req: Request, res: Response, next: NextFunction): void => {
    this.pagesService
      .list(req.filters, req.order, req.pagination)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch(next);
  };

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
