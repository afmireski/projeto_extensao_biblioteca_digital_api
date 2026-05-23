export interface OcrResult {
  confidence: number;
  raw: {
    full_text: string;
    [key: string]: unknown;
  };
}

export interface IOcrClient {
  processImage(imagePath: string): Promise<OcrResult>;
}
