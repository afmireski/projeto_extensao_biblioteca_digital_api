import type { IOcrRepository } from './ocr.repository.port';
import type { IQueueService } from '../../infra/queue/queue.interface';
import type { IOcrClient } from '../../infra/ocr/ocr-client.interface';
import type { OcrJobEntity } from './ocr.types';
import { logger } from '../../shared/logger';
import { InternalError } from '../../shared/errors/app-errors';

/**
 * Service managing OCR jobs.
 * Handles job scheduling by publishing to queue and actual job execution.
 */
export class OcrService {
  constructor(
    private readonly ocrRepository: IOcrRepository,
    private readonly queueService: IQueueService,
    private readonly ocrClient: IOcrClient,
  ) {}

  /**
   * Creates an OCR job and publishes a message to RabbitMQ.
   * Throws InternalError if the creation or publishing fails.
   * @param pageId - The page UUID.
   * @returns A promise resolving to the created OcrJobEntity.
   */
  scheduleOcrJob(pageId: string): Promise<OcrJobEntity> {
    return this.ocrRepository
      .create({ pageId })
      .then((job) => {
        return this.queueService
          .publish('ocr.exchange', 'ocr.process.key', {
            jobId: job.id,
            pageId: job.page.id,
          })
          .then(() => job);
      })
      .catch((err) => {
        logger.error({ err, pageId }, 'Failed to schedule OCR job');
        throw new InternalError({ cause: err });
      });
  }

  /**
   * Processes a scheduled OCR job.
   * Downloads page image, performs OCR text extraction, and updates job status.
   * Retries up to 3 times by sending messages back to the queue on failure.
   * @param jobId - The job UUID.
   * @param pageId - The page UUID.
   */
  processOcrJob(jobId: string, pageId: string): Promise<void> {
    return this.ocrRepository
      .findById(jobId)
      .then((job) => {
        if (!job) {
          logger.warn({ jobId }, 'OCR job not found, skipping');
          return;
        }

        if (job.status !== 'PENDING') {
          logger.info(
            { jobId, status: job.status },
            'OCR job is not PENDING, skipping',
          );
          return;
        }

        return this.ocrRepository
          .markAsProcessing(jobId)
          .then((processingJob) => {
            return this.ocrClient
              .processImage(processingJob.page.originalImagePath)
              .then(() => {
                return this.ocrRepository.markAsCompleted(jobId).then(() => {});
              })
              .catch((ocrErr) => {
                logger.warn(
                  { ocrErr, jobId, pageId, attempt: processingJob.attempt },
                  'OCR client processing failed',
                );

                const errMsg =
                  ocrErr instanceof Error ? ocrErr.message : String(ocrErr);

                if (processingJob.attempt < 3) {
                  const nextAttempt = processingJob.attempt + 1;
                  return this.ocrRepository
                    .incrementAttemptAndMarkAsPending(
                      jobId,
                      nextAttempt,
                      errMsg,
                    )
                    .then(() => {
                      return this.queueService.publish(
                        'ocr.delay.exchange',
                        'ocr.delay.key',
                        { jobId, pageId },
                      );
                    });
                } else {
                  return this.ocrRepository
                    .markAsFailed(
                      jobId,
                      `Max attempts reached. Last error: ${errMsg}`,
                    )
                    .then(() => {});
                }
              });
          });
      })
      .catch((err) => {
        logger.error({ err, jobId, pageId }, 'Error during OCR job processing');
        throw err;
      });
  }
}
