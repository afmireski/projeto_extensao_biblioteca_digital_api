import type { IQueueService } from '../../infra/queue/queue.interface';
import type { OcrService } from './ocr.service';
import { logger } from '../../shared/logger';

export class OcrConsumer {
  constructor(
    private readonly queueService: IQueueService,
    private readonly ocrService: OcrService,
  ) {}

  start(): Promise<void> {
    return this.queueService.consume(
      'ocr.process.queue',
      (content, ack, nack) => {
        logger.info({ content }, 'Received OCR job message');
        const { jobId, pageId } = content as {
          jobId?: string;
          pageId?: string;
        };

        if (!jobId || !pageId) {
          logger.warn(
            { content },
            'Invalid OCR job message content, discarding',
          );
          ack();
          return Promise.resolve();
        }

        return this.ocrService
          .processOcrJob(jobId, pageId)
          .then(() => {
            ack();
          })
          .catch((err) => {
            logger.error(
              { err, jobId, pageId },
              'Error processing OCR job message',
            );
            nack(true);
          });
      },
    );
  }
}
