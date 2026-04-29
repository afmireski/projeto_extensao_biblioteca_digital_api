export interface Edition {
  id: string;
  source_id: string;
  number: string | null;
  published_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface EditionWithSource extends Edition {
  source_name: string;
  source_type: string;
  source_language: string;
}

export interface CreateEditionDTO {
  sourceId: string;
  number?: string;
  publishedAt?: string; // YYYY-MM-DD
  notes?: string;
}

export interface UpdateEditionDTO {
  number?: string;
  publishedAt?: string; // YYYY-MM-DD
  notes?: string;
}

import type { FilterRelation } from '../../shared/types/query';

export interface ListEditionsFilters {
  number?: FilterRelation<string>;
  published_at?: FilterRelation<string>;
  source_name?: FilterRelation<string>;
  source_type?: FilterRelation<string>;
  source_language?: FilterRelation<string>;
}

export type ListEditionsOrderParams = Partial<
  Record<'number' | 'published_at' | 'created_at', 'asc' | 'desc'>
>;

export interface ListEditionsResult {
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
  data: Edition[];
}
