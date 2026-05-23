/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { IStorageAdapter } from '../../../../src/infra/storage/storage.interface';
import type { IPagesRepository } from '../../../../src/modules/pages/pages.repository.port';
import { PagesService } from '../../../../src/modules/pages/pages.service';
import type {
  UploadFileDTO,
  PageEntity,
} from '../../../../src/modules/pages/pages.types';
import {
  InternalError,
  NotFoundError,
} from '../../../../src/shared/errors/app-errors';

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
  let pagesRepositoryMock: IPagesRepository & {
    create: ReturnType<typeof mock>;
    list: ReturnType<typeof mock>;
    deleteManyByIds: ReturnType<typeof mock>;
  };
  let storageAdapterMock: IStorageAdapter & {
    upload: ReturnType<typeof mock>;
    delete: ReturnType<typeof mock>;
  };
  let ocrFacadeMock: {
    scheduleOcrJob: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    pagesRepositoryMock = {
      create: mock(() => Promise.resolve({} as PageEntity)),
      list: mock(() => Promise.resolve({ data: [], total: 0 })),
      deleteManyByIds: mock(() => Promise.resolve([])),
    } as unknown as IPagesRepository & {
      create: ReturnType<typeof mock>;
      list: ReturnType<typeof mock>;
      deleteManyByIds: ReturnType<typeof mock>;
    };

    storageAdapterMock = {
      upload: mock(() => Promise.resolve({ path: 'mock-path' })),
      delete: mock(() => Promise.resolve()),
    } as unknown as IStorageAdapter & {
      upload: ReturnType<typeof mock>;
      delete: ReturnType<typeof mock>;
    };

    ocrFacadeMock = {
      scheduleOcrJob: mock(() => Promise.resolve({} as any)),
    };

    pagesService = new PagesService(
      pagesRepositoryMock,
      storageAdapterMock,
      ocrFacadeMock as any,
    );
  });

  describe('uploadPage', () => {
    it('deve fazer upload de uma página com sucesso', async () => {
      const editionId = 'b0400000-0000-7000-8000-000000000000';
      const file: UploadFileDTO = {
        buffer: Buffer.from('1'),
        mimetype: 'image/jpeg',
        originalname: '1.jpg',
      };

      pagesRepositoryMock.create.mockResolvedValue({
        id: '1',
        number: 1,
        original_image_path: 'p1',
        edition_id: editionId,
        display_image_path: 'd1',
        thumb_image_path: 't1',
        ocr_status: 'waiting',
        ocr_confidence: null,
      });

      const result = await pagesService.uploadPage(editionId, file, 1);

      expect(storageAdapterMock.upload).toHaveBeenCalledTimes(3); // 1 arquivo * 3 variantes
      expect(pagesRepositoryMock.create).toHaveBeenCalledTimes(1);
      const callArgs = pagesRepositoryMock.create.mock!.calls[0]![0]!;
      expect(callArgs.number).toBe(1);
      expect(result.id).toBe('1');
      expect(ocrFacadeMock.scheduleOcrJob).toHaveBeenCalledWith('1');
    });

    it('deve falhar com InternalError se repositório falhar', async () => {
      pagesRepositoryMock.create.mockRejectedValue(new Error('DB Error'));

      const editionId = 'b0400000-0000-7000-8000-000000000000';
      const file: UploadFileDTO = {
        buffer: Buffer.from('1'),
        mimetype: 'image/jpeg',
        originalname: '1.jpg',
      };

      expect(pagesService.uploadPage(editionId, file, 1)).rejects.toThrow(
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
