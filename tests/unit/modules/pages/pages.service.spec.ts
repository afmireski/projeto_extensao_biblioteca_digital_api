import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { PagesService } from '../../../../src/modules/pages/pages.service';
import {
  InternalError,
  NotFoundError,
} from '../../../../src/shared/errors/app-errors';
import type { UploadFileDTO } from '../../../../src/modules/pages/pages.types';

// Mock do módulo de processamento de imagem
mock.module('../../../../src/infra/image/image.processor', () => ({
  generateVariants: mock((input) =>
    Promise.resolve({
      original: input,
      display: Buffer.from('display'),
      thumb: Buffer.from('thumb'),
    }),
  ),
}));

describe('PagesService', () => {
  let pagesService: PagesService;
  let pagesRepositoryMock: any;
  let storageAdapterMock: any;

  beforeEach(() => {
    pagesRepositoryMock = {
      createMany: mock(() => Promise.resolve([])),
      list: mock(() => Promise.resolve({ data: [], total: 0 })),
      deleteManyByIds: mock(() => Promise.resolve([])),
    };

    storageAdapterMock = {
      upload: mock(() => Promise.resolve({ path: 'mock-path' })),
      delete: mock(() => Promise.resolve()),
    };

    pagesService = new PagesService(pagesRepositoryMock, storageAdapterMock);
  });

  describe('uploadBatch', () => {
    it('deve fazer upload de múltiplas páginas com sucesso', async () => {
      const editionId = 'b0400000-0000-7000-8000-000000000000';
      const files: UploadFileDTO[] = [
        {
          buffer: Buffer.from('1'),
          mimetype: 'image/jpeg',
          originalname: '1.jpg',
        },
        {
          buffer: Buffer.from('2'),
          mimetype: 'image/png',
          originalname: '2.png',
        },
      ];

      pagesRepositoryMock.createMany.mockResolvedValue([
        {
          id: '1',
          number: 1,
          original_image_path: 'p1',
          edition_id: editionId,
          display_image_path: 'd1',
          thumb_image_path: 't1',
          ocr_status: 'waiting',
          ocr_confidence: null,
        },
        {
          id: '2',
          number: 2,
          original_image_path: 'p2',
          edition_id: editionId,
          display_image_path: 'd2',
          thumb_image_path: 't2',
          ocr_status: 'waiting',
          ocr_confidence: null,
        },
      ]);

      const result = await pagesService.uploadBatch(editionId, files, 1);

      expect(storageAdapterMock.upload).toHaveBeenCalledTimes(6); // 2 arquivos * 3 variantes
      expect(pagesRepositoryMock.createMany).toHaveBeenCalledTimes(1);
      const callArgs = pagesRepositoryMock.createMany.mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].number).toBe(1);
      expect(callArgs[1].number).toBe(2);
      expect(result).toHaveLength(2);
    });

    it('deve falhar com InternalError se repositório falhar', async () => {
      pagesRepositoryMock.createMany.mockRejectedValue(new Error('DB Error'));

      const editionId = 'b0400000-0000-7000-8000-000000000000';
      const files: UploadFileDTO[] = [
        {
          buffer: Buffer.from('1'),
          mimetype: 'image/jpeg',
          originalname: '1.jpg',
        },
      ];

      expect(pagesService.uploadBatch(editionId, files, 1)).rejects.toThrow(
        InternalError,
      );
    });
  });

  describe('list', () => {
    it('deve listar páginas, mapeando caminhos para urls', async () => {
      const editionId = 'b0400000-0000-7000-8000-000000000000';
      process.env.STORAGE_ENDPOINT = 'http://mock-storage';

      pagesRepositoryMock.list.mockResolvedValue({
        data: [
          {
            id: '1',
            number: 1,
            original_image_path: 'p1',
            edition_id: editionId,
            display_image_path: 'd1',
            thumb_image_path: 't1',
            ocr_status: 'waiting',
            ocr_confidence: null,
          },
        ],
        total: 1,
      });

      const result = await pagesService.list(
        { edition_id: { eq: editionId } },
        undefined,
        { page: 1, limit: 10, offset: 0 },
      );

      expect(result.metadata.total).toBe(1);
      expect(result.data[0]).not.toHaveProperty('original_image_path');
      expect(result.data[0]?.display_image_url).toBe('http://mock-storage/d1');
      expect(result.data[0]?.thumb_image_url).toBe('http://mock-storage/t1');
    });
  });

  describe('deleteBatch', () => {
    it('deve deletar páginas e remover do storage com sucesso', async () => {
      const editionId = 'b0400000-0000-7000-8000-000000000000';
      pagesRepositoryMock.deleteManyByIds.mockResolvedValue([
        {
          id: '1',
          number: 1,
          original_image_path: 'p1',
          edition_id: editionId,
          display_image_path: 'd1',
          thumb_image_path: 't1',
          ocr_status: 'waiting',
          ocr_confidence: null,
        },
      ]);

      await pagesService.deleteBatch(['1']);

      expect(pagesRepositoryMock.deleteManyByIds).toHaveBeenCalledWith(['1']);
      expect(storageAdapterMock.delete).toHaveBeenCalledTimes(3); // original, display, thumb
    });

    it('deve lançar NotFoundError se nenhuma página for deletada', async () => {
      pagesRepositoryMock.deleteManyByIds.mockResolvedValue([]);

      expect(pagesService.deleteBatch(['1'])).rejects.toThrow(NotFoundError);
      expect(storageAdapterMock.delete).not.toHaveBeenCalled();
    });
  });
});
