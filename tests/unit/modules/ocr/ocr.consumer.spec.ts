/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { OcrConsumer } from '../../../../src/modules/ocr/ocr.consumer';
import type { IQueueService } from '../../../../src/infra/queue/queue.interface';
import type { OcrService } from '../../../../src/modules/ocr/ocr.service';

describe('OcrConsumer', () => {
  let ocrConsumer: OcrConsumer;
  let queueServiceMock: IQueueService & {
    consume: ReturnType<typeof mock>;
  };
  let ocrServiceMock: OcrService & {
    processOcrJob: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    queueServiceMock = {
      connect: mock(() => Promise.resolve()),
      publish: mock(() => Promise.resolve()),
      consume: mock(() => Promise.resolve()),
      close: mock(() => Promise.resolve()),
    };

    ocrServiceMock = {
      processOcrJob: mock(() => Promise.resolve()),
    } as any;

    ocrConsumer = new OcrConsumer(queueServiceMock, ocrServiceMock);
  });

  it('deve registrar o consumidor na fila correta', () => {
    return ocrConsumer.start().then(() => {
      expect(queueServiceMock.consume).toHaveBeenCalledTimes(1);
      const callArgs = queueServiceMock.consume.mock.calls[0];
      expect(callArgs?.[0]).toBe('ocr.process.queue');
    });
  });

  it('deve processar mensagem válida, fazer ack e não fazer nack', () => {
    let messageCallback: any;
    queueServiceMock.consume.mockImplementation((queue, cb) => {
      messageCallback = cb;
      return Promise.resolve();
    });

    const ackMock = mock();
    const nackMock = mock();

    return ocrConsumer.start().then(() => {
      expect(messageCallback).toBeDefined();

      const messageContent = { jobId: 'job-123', pageId: 'page-123' };
      const promise = messageCallback(messageContent, ackMock, nackMock);

      return promise.then(() => {
        expect(ocrServiceMock.processOcrJob).toHaveBeenCalledWith(
          'job-123',
          'page-123',
        );
        expect(ackMock).toHaveBeenCalledTimes(1);
        expect(nackMock).not.toHaveBeenCalled();
      });
    });
  });

  it('deve descartar e fazer ack se a mensagem for inválida', () => {
    let messageCallback: any;
    queueServiceMock.consume.mockImplementation((queue, cb) => {
      messageCallback = cb;
      return Promise.resolve();
    });

    const ackMock = mock();
    const nackMock = mock();

    return ocrConsumer.start().then(() => {
      const messageContent = { invalid: true };
      const promise = messageCallback(messageContent, ackMock, nackMock);

      return promise.then(() => {
        expect(ocrServiceMock.processOcrJob).not.toHaveBeenCalled();
        expect(ackMock).toHaveBeenCalledTimes(1);
        expect(nackMock).not.toHaveBeenCalled();
      });
    });
  });

  it('deve fazer nack(true) se o processamento falhar', () => {
    let messageCallback: any;
    queueServiceMock.consume.mockImplementation((queue, cb) => {
      messageCallback = cb;
      return Promise.resolve();
    });

    const ackMock = mock();
    const nackMock = mock();
    ocrServiceMock.processOcrJob.mockRejectedValue(new Error('System failure'));

    return ocrConsumer.start().then(() => {
      const messageContent = { jobId: 'job-123', pageId: 'page-123' };
      const promise = messageCallback(messageContent, ackMock, nackMock);

      return promise.then(() => {
        expect(ackMock).not.toHaveBeenCalled();
        expect(nackMock).toHaveBeenCalledWith(true);
      });
    });
  });
});
