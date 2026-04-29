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

import type { FilterRelation } from '../../shared/types/query';

export interface ListSourcesFilters {
  name?: FilterRelation<string>;
  type?: FilterRelation<string>;
  language?: FilterRelation<string>;
  collection_id?: FilterRelation<string>;
}

export type ListSourcesOrderParams = Partial<
  Record<'name' | 'type' | 'created_at', 'asc' | 'desc'>
>;

export interface ListSourcesResult {
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
  data: Source[];
}
