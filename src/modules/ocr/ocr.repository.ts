import type { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IOcrRepository } from './ocr.repository.port';
import type { OcrJobEntity, CreateOcrJobDTO } from './ocr.types';
import { InternalError } from '../../shared/errors/app-errors';

/**
 * Kysely-based database implementation of the OCR jobs repository port.
 * Executes queries on the 'ocr_jobs' table, joining 'pages' for original file paths.
 */
export class OcrRepository implements IOcrRepository {
  constructor(private readonly db: Kysely<DB>) {}

  /**
   * Finds an OCR job by ID joined with its page info.
   * @param id - The job UUID.
   * @returns A promise resolving to the OcrJobEntity, or undefined if not found.
   */
  findById(id: string): Promise<OcrJobEntity | undefined> {
    return this.db
      .selectFrom('ocr_jobs')
      .innerJoin('pages', 'pages.id', 'ocr_jobs.page_id')
      .select([
        'ocr_jobs.id as job_id',
        'ocr_jobs.page_id as job_page_id',
        'ocr_jobs.status as job_status',
        'ocr_jobs.attempt as job_attempt',
        'ocr_jobs.error as job_error',
        'ocr_jobs.created_at as job_created_at',
        'ocr_jobs.processing_at as job_processing_at',
        'ocr_jobs.completed_at as job_completed_at',
        'ocr_jobs.failed_at as job_failed_at',
        'ocr_jobs.last_attempt_at as job_last_attempt_at',
        'pages.id as page_id',
        'pages.original_image_path as page_original_image_path',
      ])
      .where('ocr_jobs.id', '=', id)
      .executeTakeFirst()
      .then((row) => {
        if (!row) return undefined;
        return {
          id: row.job_id,
          page: {
            id: row.page_id,
            originalImagePath: row.page_original_image_path,
          },
          status: row.job_status,
          attempt: row.job_attempt,
          error: row.job_error,
          createdAt: new Date(row.job_created_at),
          processingAt: row.job_processing_at
            ? new Date(row.job_processing_at)
            : null,
          completedAt: row.job_completed_at
            ? new Date(row.job_completed_at)
            : null,
          failedAt: row.job_failed_at ? new Date(row.job_failed_at) : null,
          lastAttemptAt: new Date(row.job_last_attempt_at),
        } satisfies OcrJobEntity;
      });
  }

  /**
   * Creates a new OCR job in PENDING status.
   * @param data - The DTO containing the page ID.
   * @returns A promise resolving to the created OcrJobEntity.
   */
  create(data: CreateOcrJobDTO): Promise<OcrJobEntity> {
    return this.db
      .insertInto('ocr_jobs')
      .values({
        page_id: data.pageId,
        status: 'PENDING',
        attempt: 1,
        last_attempt_at: new Date(),
      })
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => this.findById(row.id))
      .then((job) => {
        if (!job) {
          throw new InternalError('Failed to retrieve created OCR job');
        }
        return job;
      });
  }

  /**
   * Updates an OCR job status to PROCESSING and sets processing date.
   * @param id - The job UUID.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsProcessing(id: string): Promise<OcrJobEntity> {
    return this.db
      .updateTable('ocr_jobs')
      .set({
        status: 'PROCESSING',
        processing_at: new Date(),
        last_attempt_at: new Date(),
      })
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => this.findById(row.id))
      .then((job) => {
        if (!job) {
          throw new InternalError('Job not found after marking as processing');
        }
        return job;
      });
  }

  /**
   * Updates an OCR job status to COMPLETED and sets completion date.
   * @param id - The job UUID.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsCompleted(id: string): Promise<OcrJobEntity> {
    return this.db
      .updateTable('ocr_jobs')
      .set({
        status: 'COMPLETED',
        completed_at: new Date(),
      })
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => this.findById(row.id))
      .then((job) => {
        if (!job) {
          throw new InternalError('Job not found after marking as completed');
        }
        return job;
      });
  }

  /**
   * Increments the attempt counter, registers the error, and sets status to PENDING.
   * @param id - The job UUID.
   * @param nextAttempt - Next sequential attempt count.
   * @param error - Failure error message.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  incrementAttemptAndMarkAsPending(
    id: string,
    nextAttempt: number,
    error: string,
  ): Promise<OcrJobEntity> {
    return this.db
      .updateTable('ocr_jobs')
      .set({
        status: 'PENDING',
        attempt: nextAttempt,
        error: error,
        last_attempt_at: new Date(),
      })
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => this.findById(row.id))
      .then((job) => {
        if (!job) {
          throw new InternalError('Job not found after incrementing attempt');
        }
        return job;
      });
  }

  /**
   * Marks job as FAILED and stores final error message.
   * @param id - The job UUID.
   * @param error - The final error message.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsFailed(id: string, error: string): Promise<OcrJobEntity> {
    return this.db
      .updateTable('ocr_jobs')
      .set({
        status: 'FAILED',
        error: error,
        failed_at: new Date(),
      })
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => this.findById(row.id))
      .then((job) => {
        if (!job) {
          throw new InternalError('Job not found after marking as failed');
        }
        return job;
      });
  }
}
