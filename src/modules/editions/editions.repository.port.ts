import type { PaginationParams } from '../../shared/types/query';
import type {
  CreateEditionDTO,
  Edition,
  EditionWithSource,
  ListEditionsFilters,
  ListEditionsOrderParams,
  ListEditionsResult,
  UpdateEditionDTO,
} from './editions.types';

export interface IEditionsRepository {
  create(data: CreateEditionDTO): Promise<Edition>;
  findById(id: string): Promise<EditionWithSource | undefined>;
  update(id: string, data: UpdateEditionDTO): Promise<Edition | undefined>;
  softDelete(id: string): Promise<boolean>;
  list(
    filters?: ListEditionsFilters,
    order?: ListEditionsOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListEditionsResult>;
}
