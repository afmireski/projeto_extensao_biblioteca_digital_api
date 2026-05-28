import type { OcrJobEntity, CreateOcrJobDTO } from './ocr.types';

/**
 * Repository interface for managing OCR processing jobs.
 * Outlines methods to create, find, update status, and track attempts for OCR tasks.
 */
export interface IOcrRepository {
  /**
   * Creates a new OCR job record.
   * @param data - The DTO containing the page ID.
   * @returns A promise resolving to the created OcrJobEntity.
   */
  create(data: CreateOcrJobDTO): Promise<OcrJobEntity>;

  /**
   * Finds an OCR job by its unique ID.
   * @param id - The UUID of the job.
   * @returns A promise resolving to the OcrJobEntity, or undefined if not found.
   */
  findById(id: string): Promise<OcrJobEntity | undefined>;

  /**
   * Updates job status to 'PROCESSING'.
   * @param id - The UUID of the job.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsProcessing(id: string): Promise<OcrJobEntity>;

  /**
   * Updates job status to 'COMPLETED'.
   * @param id - The UUID of the job.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsCompleted(id: string): Promise<OcrJobEntity>;

  /**
   * Increments the attempt counter and resets status to 'PENDING'.
   * @param id - The UUID of the job.
   * @param nextAttempt - The next attempt iteration number.
   * @param error - The error message that caused the retry.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  incrementAttemptAndMarkAsPending(
    id: string,
    nextAttempt: number,
    error: string,
  ): Promise<OcrJobEntity>;

  /**
   * Updates job status to 'FAILED' with the final error description.
   * @param id - The UUID of the job.
   * @param error - The final failure error message.
   * @returns A promise resolving to the updated OcrJobEntity.
   */
  markAsFailed(id: string, error: string): Promise<OcrJobEntity>;
}
