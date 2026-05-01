import type {
  CreatePageDTO,
  PageEntity,
  ListPagesFilters,
  ListPagesOrderParams,
} from './pages.types';
import type { PaginationParams } from '../../shared/types/query';

export interface IPagesRepository {
  createMany(pages: CreatePageDTO[]): Promise<PageEntity[]>;
  list(
    filters?: ListPagesFilters,
    order?: ListPagesOrderParams,
    pagination?: PaginationParams,
  ): Promise<{ data: PageEntity[]; total: number }>;
  deleteManyByIds(pageIds: string[]): Promise<PageEntity[]>;
}
