export interface Source {
  id: string;
  collection_id: string | null;
  name: string;
  type: 'newspaper' | 'magazine' | 'book';
  language: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateSourceDTO {
  collectionId?: string;
  name: string;
  type: 'newspaper' | 'magazine' | 'book';
  language: string;
  metadata: Record<string, unknown>;
}

export interface UpdateSourceDTO {
  collectionId?: string;
  name?: string;
  type?: 'newspaper' | 'magazine' | 'book';
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface ListSourcesResult {
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
  data: Source[];
}
