import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/app-errors';
import type { PagesService } from './pages.service';
import type { UploadFileDTO } from './pages.types';

export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  uploadBatch = (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(
        new ValidationError('Nenhuma imagem recebida', {
          files: 'Obrigatório',
        }),
      );
    }

    const editionId = req.body.edition_id;
    const startingNumber = req.body.starting_number;

    const fileDTOs: UploadFileDTO[] = files.map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
      originalname: f.originalname,
    }));

    this.pagesService
      .uploadBatch(editionId, fileDTOs, startingNumber)
      .then(() => {
        res
          .status(201)
          .json({ message: 'Páginas processadas e registradas com sucesso.' });
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
