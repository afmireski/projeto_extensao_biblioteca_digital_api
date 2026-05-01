import { describe, it, expect, mock, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { PagesController } from '../../../../src/modules/pages/pages.controller';
import type { PagesService } from '../../../../src/modules/pages/pages.service';
import { ValidationError } from '../../../../src/shared/errors/app-errors';

describe('PagesController', () => {
  let pagesController: PagesController;
  let pagesServiceMock: PagesService & {
    uploadBatch: ReturnType<typeof mock>;
    list: ReturnType<typeof mock>;
    deleteBatch: ReturnType<typeof mock>;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction & ReturnType<typeof mock>;

  beforeEach(() => {
    pagesServiceMock = {
      uploadBatch: mock(() => Promise.resolve([])),
      list: mock(() => Promise.resolve({ data: [], metadata: {} })),
      deleteBatch: mock(() => Promise.resolve()),
    } as unknown as PagesService & {
      uploadBatch: ReturnType<typeof mock>;
      list: ReturnType<typeof mock>;
      deleteBatch: ReturnType<typeof mock>;
    };

    pagesController = new PagesController(pagesServiceMock);

    req = {
      body: {},
      query: {},
    };

    res = {
      status: mock().mockReturnThis(),
      json: mock().mockReturnThis(),
      send: mock().mockReturnThis(),
    };

    next = mock();
  });

  describe('uploadBatch', () => {
    it('deve processar upload com sucesso', async () => {
      req.files = [
        {
          buffer: Buffer.from('mock'),
          mimetype: 'image/jpeg',
          originalname: '1.jpg',
        } as Express.Multer.File,
      ];
      req.body = {
        edition_id: 'b0400000-0000-7000-8000-000000000000',
        starting_number: 1,
      };

      await pagesController.uploadBatch(req as Request, res as Response, next);

      expect(pagesServiceMock.uploadBatch).toHaveBeenCalledWith(
        'b0400000-0000-7000-8000-000000000000',
        [
          {
            buffer: expect.any(Buffer),
            mimetype: 'image/jpeg',
            originalname: '1.jpg',
          },
        ],
        1,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it('deve chamar next com ValidationError se array de files estiver vazio', async () => {
      req.files = [];
      req.body = {
        edition_id: 'b0400000-0000-7000-8000-000000000000',
        starting_number: 1,
      };

      await pagesController.uploadBatch(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(pagesServiceMock.uploadBatch).not.toHaveBeenCalled();
    });
  });

  describe('deleteBatch', () => {
    it('deve processar deleção com sucesso', async () => {
      req.body = { page_ids: ['b0400000-0000-7000-8000-000000000000'] };

      await pagesController.deleteBatch(req as Request, res as Response, next);

      expect(pagesServiceMock.deleteBatch).toHaveBeenCalledWith([
        'b0400000-0000-7000-8000-000000000000',
      ]);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
