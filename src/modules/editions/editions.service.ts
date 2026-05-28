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

/**
 * Service managing logic operations for source editions.
 * Performs checks on parent sources before delegating database updates.
 */
export class EditionsService {
  constructor(
    private readonly editionsRepository: IEditionsRepository,
    private readonly sourcesRepository: ISourcesRepository,
  ) {}

  /**
   * Creates a new edition of a document source.
   * Validates that the referenced parent source exists.
   * @param data - The DTO containing the creation fields.
   * @returns A promise resolving to the created Edition entity.
   */
  createEdition(data: CreateEditionDTO): Promise<Edition> {
    return this.sourcesRepository.findById(data.sourceId).then((source) => {
      if (!source) {
        throw sourceNotFound();
      }
      return this.editionsRepository.create(data);
    });
  }

  /**
   * Retrieves an active edition by its ID, enriched with its source details.
   * Throws NotFoundError if the edition is not active or its parent source is soft-deleted.
   * @param id - The UUID of the edition.
   * @returns A promise resolving to the EditionWithSource details.
   */
  getEditionById(id: string): Promise<EditionWithSource> {
    return this.editionsRepository.findById(id).then((edition) => {
      if (!edition) {
        throw editionNotFound();
      }
      return edition;
    });
  }

  /**
   * Updates an existing edition's fields.
   * Throws NotFoundError if the edition does not exist.
   * @param id - The UUID of the edition to update.
   * @param data - The DTO containing the fields to update.
   * @returns A promise resolving to the updated Edition.
   */
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

  /**
   * Soft-deletes an edition.
   * Throws NotFoundError if the edition is not found.
   * @param id - The UUID of the edition to soft-delete.
   * @returns A promise resolving to void.
   */
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

  /**
   * Lists source editions matching search criteria and pagination boundaries.
   * @param filters - Active search filters.
   * @param order - Directional ordering params.
   * @param pagination - Limit and offset bounds.
   * @returns A promise resolving to the paginated list results.
   */
  listEditions(
    filters?: ListEditionsFilters,
    order?: ListEditionsOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListEditionsResult> {
    return this.editionsRepository.list(filters, order, pagination);
  }
}
