import type { PaginationParams } from '../../shared/types/query';
import type {
  CreateSourceDTO,
  ListSourcesResult,
  Source,
  UpdateSourceDTO,
  ListSourcesFilters,
  ListSourcesOrderParams,
} from './sources.types';

export interface ISourcesRepository {
  create(data: CreateSourceDTO): Promise<Source>;
  findById(id: string): Promise<Source | undefined>;
  update(id: string, data: UpdateSourceDTO): Promise<Source | undefined>;
  softDelete(id: string): Promise<boolean>;
  list(
    filters?: ListSourcesFilters,
    order?: ListSourcesOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult>;
}
