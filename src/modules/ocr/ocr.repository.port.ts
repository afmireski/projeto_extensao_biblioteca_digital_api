import type { OcrJobEntity, CreateOcrJobDTO } from './ocr.types';

export interface IOcrRepository {
  create(data: CreateOcrJobDTO): Promise<OcrJobEntity>;
  findById(id: string): Promise<OcrJobEntity | undefined>;
  markAsProcessing(id: string): Promise<OcrJobEntity>;
  markAsCompleted(id: string): Promise<OcrJobEntity>;
  incrementAttemptAndMarkAsPending(
    id: string,
    nextAttempt: number,
    error: string,
  ): Promise<OcrJobEntity>;
  markAsFailed(id: string, error: string): Promise<OcrJobEntity>;
}
