export interface UploadResult {
  path: string;
}

export interface IStorageAdapter {
  upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<UploadResult>;
  delete(bucket: string, key: string): Promise<void>;
}
