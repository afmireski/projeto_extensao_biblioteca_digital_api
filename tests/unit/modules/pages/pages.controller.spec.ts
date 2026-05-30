import { describe, it, expect, mock, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { PagesController } from '../../../../src/modules/pages/pages.controller';
import type { PagesService } from '../../../../src/modules/pages/pages.service';
import { ValidationError } from '../../../../src/shared/errors/app-errors';
import type { PageEntity } from '../../../../src/modules/pages/pages.types';

describe('PagesController', () => {
  let pagesController: PagesController;
  let pagesServiceMock: PagesService & {
    uploadPage: ReturnType<typeof mock>;
    list: ReturnType<typeof mock>;
    deleteBatch: ReturnType<typeof mock>;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction & ReturnType<typeof mock>;

  beforeEach(() => {
    pagesServiceMock = {
      uploadPage: mock(() => Promise.resolve({} as PageEntity)),
      list: mock(() => Promise.resolve({ data: [], metadata: {} })),
      deleteBatch: mock(() => Promise.resolve()),
    } as unknown as PagesService & {
      uploadPage: ReturnType<typeof mock>;
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

  describe('upload', () => {
    it('deve processar upload com sucesso', async () => {
      req.file = {
        buffer: Buffer.from('mock'),
        mimetype: 'image/jpeg',
        originalname: '1.jpg',
      } as Express.Multer.File;
      req.body = {
        edition_id: 'b0400000-0000-7000-8000-000000000000',
        number: 1,
      };

      const mockPage = {
        id: '1',
        edition_id: 'b0400000-0000-7000-8000-000000000000',
        number: 1,
        original_image_path: 'p1',
        display_image_path: 'd1',
        thumb_image_path: 't1',
        ocr_status: 'waiting',
        ocr_confidence: null,
      };
      pagesServiceMock.uploadPage.mockResolvedValue(mockPage);

      await pagesController.upload(req as Request, res as Response, next);

      expect(pagesServiceMock.uploadPage).toHaveBeenCalledWith(
        'b0400000-0000-7000-8000-000000000000',
        {
          buffer: expect.any(Buffer),
          mimetype: 'image/jpeg',
          originalname: '1.jpg',
        },
        1,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it('deve chamar next com ValidationError se file estiver ausente', async () => {
      req.file = undefined;
      req.body = {
        edition_id: 'b0400000-0000-7000-8000-000000000000',
        number: 1,
      };

      await pagesController.upload(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(pagesServiceMock.uploadPage).not.toHaveBeenCalled();
    });
  });

  describe('deleteBatch', () => {
    it('deve processar deleção com sucesso', async () => {
      const editionId = 'b0400000-0000-7000-8000-000000000000';
      const pageId = 'b0400000-0000-7000-8000-000000000001';
      req.body = {
        edition_id: editionId,
        page_ids: [pageId],
      };

      await pagesController.deleteBatch(req as Request, res as Response, next);

      expect(pagesServiceMock.deleteBatch).toHaveBeenCalledWith(editionId, [
        pageId,
      ]);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
