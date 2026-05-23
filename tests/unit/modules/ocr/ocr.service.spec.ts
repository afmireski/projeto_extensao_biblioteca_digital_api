import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { OcrService } from '../../../../src/modules/ocr/ocr.service';
import type { IOcrRepository } from '../../../../src/modules/ocr/ocr.repository.port';
import type { IQueueService } from '../../../../src/infra/queue/queue.interface';
import type { IOcrClient } from '../../../../src/infra/ocr/ocr-client.interface';
import type { OcrJobEntity } from '../../../../src/modules/ocr/ocr.types';
import { InternalError } from '../../../../src/shared/errors/app-errors';

describe('OcrService', () => {
  let ocrService: OcrService;
  let ocrRepositoryMock: IOcrRepository & {
    create: ReturnType<typeof mock>;
    findById: ReturnType<typeof mock>;
    markAsProcessing: ReturnType<typeof mock>;
    markAsCompleted: ReturnType<typeof mock>;
    incrementAttemptAndMarkAsPending: ReturnType<typeof mock>;
    markAsFailed: ReturnType<typeof mock>;
  };
  let queueServiceMock: IQueueService & {
    connect: ReturnType<typeof mock>;
    publish: ReturnType<typeof mock>;
    consume: ReturnType<typeof mock>;
    close: ReturnType<typeof mock>;
  };
  let ocrClientMock: IOcrClient & {
    processImage: ReturnType<typeof mock>;
  };

  const mockDate = new Date();
  const makeFakeJob = (
    id: string,
    status = 'PENDING',
    attempt = 1,
  ): OcrJobEntity => ({
    id,
    page: {
      id: 'page-123',
      originalImagePath: 'pages-originals/test-image.jpg',
    },
    status,
    attempt,
    error: null,
    createdAt: mockDate,
    processingAt: null,
    completedAt: null,
    failedAt: null,
    lastAttemptAt: mockDate,
  });

  beforeEach(() => {
    ocrRepositoryMock = {
      create: mock(() => Promise.resolve({} as OcrJobEntity)),
      findById: mock(() => Promise.resolve(undefined)),
      markAsProcessing: mock(() => Promise.resolve({} as OcrJobEntity)),
      markAsCompleted: mock(() => Promise.resolve({} as OcrJobEntity)),
      incrementAttemptAndMarkAsPending: mock(() =>
        Promise.resolve({} as OcrJobEntity),
      ),
      markAsFailed: mock(() => Promise.resolve({} as OcrJobEntity)),
    };

    queueServiceMock = {
      connect: mock(() => Promise.resolve()),
      publish: mock(() => Promise.resolve()),
      consume: mock(() => Promise.resolve()),
      close: mock(() => Promise.resolve()),
    };

    ocrClientMock = {
      processImage: mock(() =>
        Promise.resolve({ confidence: 0.9, raw: { full_text: 'OK' } }),
      ),
    };

    ocrService = new OcrService(
      ocrRepositoryMock,
      queueServiceMock,
      ocrClientMock,
    );
  });

  describe('scheduleOcrJob', () => {
    it('deve criar o job e publicar mensagem no RabbitMQ com sucesso', () => {
      const pageId = 'page-123';
      const fakeJob = makeFakeJob('job-123');

      ocrRepositoryMock.create.mockResolvedValue(fakeJob);

      return ocrService.scheduleOcrJob(pageId).then((result) => {
        expect(ocrRepositoryMock.create).toHaveBeenCalledWith({ pageId });
        expect(queueServiceMock.publish).toHaveBeenCalledWith(
          'ocr.exchange',
          'ocr.process.key',
          { jobId: 'job-123', pageId: 'page-123' },
        );
        expect(result).toEqual(fakeJob);
      });
    });

    it('deve lançar InternalError se a criação do job falhar', () => {
      ocrRepositoryMock.create.mockRejectedValue(new Error('Database error'));

      return expect(ocrService.scheduleOcrJob('page-123')).rejects.toThrow(
        InternalError,
      );
    });
  });

  describe('processOcrJob', () => {
    it('deve ignorar o processamento se o job não for encontrado', () => {
      ocrRepositoryMock.findById.mockResolvedValue(undefined);

      return ocrService.processOcrJob('job-123', 'page-123').then(() => {
        expect(ocrRepositoryMock.markAsProcessing).not.toHaveBeenCalled();
        expect(ocrClientMock.processImage).not.toHaveBeenCalled();
      });
    });

    it('deve ignorar o processamento se o status do job não for PENDING', () => {
      const fakeJob = makeFakeJob('job-123', 'PROCESSING');
      ocrRepositoryMock.findById.mockResolvedValue(fakeJob);

      return ocrService.processOcrJob('job-123', 'page-123').then(() => {
        expect(ocrRepositoryMock.markAsProcessing).not.toHaveBeenCalled();
        expect(ocrClientMock.processImage).not.toHaveBeenCalled();
      });
    });

    it('deve processar o OCR e marcar o job como COMPLETED em caso de sucesso', () => {
      const fakeJob = makeFakeJob('job-123', 'PENDING');
      ocrRepositoryMock.findById.mockResolvedValue(fakeJob);
      ocrRepositoryMock.markAsProcessing.mockResolvedValue({
        ...fakeJob,
        status: 'PROCESSING',
      });

      return ocrService.processOcrJob('job-123', 'page-123').then(() => {
        expect(ocrRepositoryMock.markAsProcessing).toHaveBeenCalledWith(
          'job-123',
        );
        expect(ocrClientMock.processImage).toHaveBeenCalledWith(
          'pages-originals/test-image.jpg',
        );
        expect(ocrRepositoryMock.markAsCompleted).toHaveBeenCalledWith(
          'job-123',
        );
        expect(queueServiceMock.publish).not.toHaveBeenCalled();
      });
    });

    it('deve incrementar a tentativa e enviar para fila de delay se falhar no OCR e attempt < 3', () => {
      const fakeJob = makeFakeJob('job-123', 'PENDING', 1);
      ocrRepositoryMock.findById.mockResolvedValue(fakeJob);
      ocrRepositoryMock.markAsProcessing.mockResolvedValue({
        ...fakeJob,
        status: 'PROCESSING',
      });
      ocrClientMock.processImage.mockRejectedValue(
        new Error('OCR engine error'),
      );

      return ocrService.processOcrJob('job-123', 'page-123').then(() => {
        expect(
          ocrRepositoryMock.incrementAttemptAndMarkAsPending,
        ).toHaveBeenCalledWith('job-123', 2, 'OCR engine error');
        expect(queueServiceMock.publish).toHaveBeenCalledWith(
          'ocr.delay.exchange',
          'ocr.delay.key',
          { jobId: 'job-123', pageId: 'page-123' },
        );
        expect(ocrRepositoryMock.markAsFailed).not.toHaveBeenCalled();
      });
    });

    it('deve marcar o job como FAILED e não publicar se falhar no OCR e attempt >= 3', () => {
      const fakeJob = makeFakeJob('job-123', 'PENDING', 3);
      ocrRepositoryMock.findById.mockResolvedValue(fakeJob);
      ocrRepositoryMock.markAsProcessing.mockResolvedValue({
        ...fakeJob,
        status: 'PROCESSING',
      });
      ocrClientMock.processImage.mockRejectedValue(
        new Error('OCR engine error'),
      );

      return ocrService.processOcrJob('job-123', 'page-123').then(() => {
        expect(ocrRepositoryMock.markAsFailed).toHaveBeenCalledWith(
          'job-123',
          'Max attempts reached. Last error: OCR engine error',
        );
        expect(queueServiceMock.publish).not.toHaveBeenCalled();
        expect(
          ocrRepositoryMock.incrementAttemptAndMarkAsPending,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
