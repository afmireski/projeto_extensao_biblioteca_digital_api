import type { OcrService } from './ocr.service';
import type { OcrJobEntity } from './ocr.types';

export class OcrFacade {
  constructor(private readonly ocrService: OcrService) {}

  scheduleOcrJob(pageId: string): Promise<OcrJobEntity> {
    return this.ocrService.scheduleOcrJob(pageId);
  }
}
