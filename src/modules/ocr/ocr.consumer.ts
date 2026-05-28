import type { IQueueService } from '../../infra/queue/queue.interface';
import type { OcrService } from './ocr.service';
import { logger } from '../../shared/logger';

/**
 * Consumer class that listens to the RabbitMQ queue for incoming OCR jobs.
 * Orchestrates job consumption and manages message acknowledgement (ack/nack).
 */
export class OcrConsumer {
  private started = false;

  constructor(
    private readonly queueService: IQueueService,
    private readonly ocrService: OcrService,
  ) {}

  /**
   * Subscribes to the OCR process queue and starts receiving messages.
   * Discards messages with invalid payloads and retries failed jobs.
   * @returns A promise resolving when the consumer has successfully subscribed.
   */
  start(): Promise<void> {
    if (this.started) {
      return Promise.resolve();
    }
    this.started = true;
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
