import type { ISourcesRepository } from './sources.repository.port';
import type {
  CreateSourceDTO,
  UpdateSourceDTO,
  Source,
  ListSourcesResult,
} from './sources.types';
import type {
  PaginationParams,
  OrderParams,
  Filters,
} from '../../shared/types/query';
import { NotFoundError } from '../../shared/errors/app-errors';

export class SourcesService {
  constructor(private readonly sourcesRepository: ISourcesRepository) {}

  createSource(data: CreateSourceDTO): Promise<Source> {
    return this.sourcesRepository.create(data);
  }

  getSourceById(id: string): Promise<Source> {
    return this.sourcesRepository.findById(id).then((source) => {
      if (!source) {
        throw new NotFoundError('Source not found');
      }
      return source;
    });
  }

  updateSource(id: string, data: UpdateSourceDTO): Promise<Source> {
    return this.sourcesRepository.findById(id).then((existingSource) => {
      if (!existingSource) {
        throw new NotFoundError('Source not found');
      }
      return this.sourcesRepository.update(id, data).then((updatedSource) => {
        if (!updatedSource) throw new NotFoundError('Source not found');
        return updatedSource;
      });
    });
  }

  deleteSource(id: string): Promise<void> {
    return this.sourcesRepository.findById(id).then((existingSource) => {
      if (!existingSource) {
        throw new NotFoundError('Source not found');
      }
      return this.sourcesRepository.softDelete(id).then((success) => {
        if (!success) throw new NotFoundError('Source not found');
      });
    });
  }

  listSources(
    filters?: Filters,
    order?: OrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult> {
    return this.sourcesRepository.list(filters, order, pagination);
  }
}
