import type { OcrService } from './ocr.service';
import type { OcrJobEntity } from './ocr.types';

/**
 * Facade class exposing OCR module functionalities to other modules.
 * Follows the Ports & Adapters and Facade patterns.
 */
export class OcrFacade {
  constructor(private readonly ocrService: OcrService) {}

  /**
   * Schedules an OCR job for a specific page ID.
   * Consumed by the Pages module.
   * @param pageId - The page UUID.
   * @returns A promise resolving to the scheduled OcrJobEntity.
   */
  scheduleOcrJob(pageId: string): Promise<OcrJobEntity> {
    return this.ocrService.scheduleOcrJob(pageId);
  }
}
