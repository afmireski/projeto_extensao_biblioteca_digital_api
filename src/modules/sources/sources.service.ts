import type { ISourcesRepository } from './sources.repository.port';
import type {
  CreateSourceDTO,
  UpdateSourceDTO,
  Source,
  ListSourcesResult,
  ListSourcesFilters,
  ListSourcesOrderParams,
} from './sources.types';
import type { PaginationParams } from '../../shared/types/query';
import { sourceNotFound } from './sources.error';

export class SourcesService {
  constructor(private readonly sourcesRepository: ISourcesRepository) {}

  createSource(data: CreateSourceDTO): Promise<Source> {
    return this.sourcesRepository.create(data);
  }

  getSourceById(id: string): Promise<Source> {
    return this.sourcesRepository.findById(id).then((source) => {
      if (!source) {
        throw sourceNotFound();
      }
      return source;
    });
  }

  updateSource(id: string, data: UpdateSourceDTO): Promise<Source> {
    return this.sourcesRepository.findById(id).then((existingSource) => {
      if (!existingSource) {
        throw sourceNotFound();
      }
      return this.sourcesRepository.update(id, data).then((updatedSource) => {
        if (!updatedSource) throw sourceNotFound();
        return updatedSource;
      });
    });
  }

  deleteSource(id: string): Promise<void> {
    return this.sourcesRepository.findById(id).then((existingSource) => {
      if (!existingSource) {
        throw sourceNotFound();
      }
      return this.sourcesRepository.softDelete(id).then((success) => {
        if (!success) throw sourceNotFound();
      });
    });
  }

  listSources(
    filters?: ListSourcesFilters,
    order?: ListSourcesOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult> {
    return this.sourcesRepository.list(filters, order, pagination);
  }
}
