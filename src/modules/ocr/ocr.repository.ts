import type { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IOcrRepository } from './ocr.repository.port';
import type { OcrJobEntity, CreateOcrJobDTO } from './ocr.types';
import { InternalError } from '../../shared/errors/app-errors';

export class OcrRepository implements IOcrRepository {
  constructor(private readonly db: Kysely<DB>) {}

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
