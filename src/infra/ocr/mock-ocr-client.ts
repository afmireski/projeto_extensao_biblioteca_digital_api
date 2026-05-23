import type { IOcrClient, OcrResult } from './ocr-client.interface';

export class MockOcrClient implements IOcrClient {
  processImage(imagePath: string): Promise<OcrResult> {
    if (imagePath.includes('mock-fail')) {
      return Promise.reject(
        new Error('Simulated OCR processing error (mock-fail)'),
      );
    }

    return Promise.resolve({
      confidence: 0.954,
      raw: {
        full_text: `Texto de exemplo extraído da imagem localizada em: ${imagePath}`,
        language: 'por',
      },
    });
  }
}
