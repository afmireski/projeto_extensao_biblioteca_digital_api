import type {
  Filters,
  OrderParams,
  PaginationParams,
} from '../../shared/types/query';
import type {
  CreateSourceDTO,
  ListSourcesResult,
  Source,
  UpdateSourceDTO,
} from './sources.types';

export interface ISourcesRepository {
  create(data: CreateSourceDTO): Promise<Source>;
  findById(id: string): Promise<Source | undefined>;
  update(id: string, data: UpdateSourceDTO): Promise<Source | undefined>;
  softDelete(id: string): Promise<boolean>;
  list(
    filters?: Filters,
    order?: OrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult>;
}
