import type { IEditionsRepository } from './editions.repository.port';
import type { ISourcesRepository } from '../sources/sources.repository.port';
import type {
  CreateEditionDTO,
  Edition,
  EditionWithSource,
  ListEditionsFilters,
  ListEditionsOrderParams,
  ListEditionsResult,
  UpdateEditionDTO,
} from './editions.types';
import type { PaginationParams } from '../../shared/types/query';
import { editionNotFound, sourceNotFound } from './editions.error';

export class EditionsService {
  constructor(
    private readonly editionsRepository: IEditionsRepository,
    private readonly sourcesRepository: ISourcesRepository,
  ) {}

  createEdition(data: CreateEditionDTO): Promise<Edition> {
    return this.sourcesRepository.findById(data.sourceId).then((source) => {
      if (!source) {
        throw sourceNotFound();
      }
      return this.editionsRepository.create(data);
    });
  }

  getEditionById(id: string): Promise<EditionWithSource> {
    return this.editionsRepository.findById(id).then((edition) => {
      if (!edition) {
        throw editionNotFound();
      }
      return edition;
    });
  }

  updateEdition(id: string, data: UpdateEditionDTO): Promise<Edition> {
    return this.editionsRepository.findById(id).then((existing) => {
      if (!existing) {
        throw editionNotFound();
      }
      return this.editionsRepository.update(id, data).then((updated) => {
        if (!updated) throw editionNotFound();
        return updated;
      });
    });
  }

  deleteEdition(id: string): Promise<void> {
    return this.editionsRepository.findById(id).then((existing) => {
      if (!existing) {
        throw editionNotFound();
      }
      return this.editionsRepository.softDelete(id).then((success) => {
        if (!success) throw editionNotFound();
      });
    });
  }

  listEditions(
    filters?: ListEditionsFilters,
    order?: ListEditionsOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListEditionsResult> {
    return this.editionsRepository.list(filters, order, pagination);
  }
}
