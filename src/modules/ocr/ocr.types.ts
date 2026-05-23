export interface OcrJobEntity {
  id: string;
  page: {
    id: string;
    originalImagePath: string;
  };
  status: string;
  attempt: number;
  error: string | null;
  createdAt: Date;
  processingAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  lastAttemptAt: Date;
}

export interface CreateOcrJobDTO {
  pageId: string;
}
