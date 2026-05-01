import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { IStorageAdapter, UploadResult } from './storage.interface';

export class S3StorageAdapter implements IStorageAdapter {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET!,
      },
      region: process.env.STORAGE_REGION ?? 'us-east-1',
      forcePathStyle: process.env.STORAGE_PATH_STYLE === 'true',
    });
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return { path: `${bucket}/${key}` };
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }
}
