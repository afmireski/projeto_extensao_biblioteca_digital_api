import type { FilterRelation } from '../../shared/types/query';

export interface PageEntity {
  id: string;
  edition_id: string;
  number: number;
  original_image_path: string;
  display_image_path: string | null;
  thumb_image_path: string | null;
  ocr_status: string;
  ocr_confidence: string | null;
}

export interface UploadFileDTO {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export interface CreatePageDTO {
  edition_id: string;
  number: number;
  original_image_path: string;
  display_image_path: string;
  thumb_image_path: string;
}

export interface ListPagesFilters {
  edition_id?: FilterRelation<string>;
}

export type ListPagesOrderParams = Partial<Record<'number', 'asc' | 'desc'>>;

export interface PageResultDTO extends Omit<
  PageEntity,
  'original_image_path' | 'display_image_path' | 'thumb_image_path'
> {
  display_image_url: string | null;
  thumb_image_url: string | null;
}

export interface ListPagesResult {
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
  data: PageResultDTO[];
}
