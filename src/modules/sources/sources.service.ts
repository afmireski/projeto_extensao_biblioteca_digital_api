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

/**
 * Service orchestrating operations related to document sources.
 * Interfaces between the controller and the repository layer.
 */
export class SourcesService {
  constructor(private readonly sourcesRepository: ISourcesRepository) {}

  /**
   * Creates a new document source.
   * @param data - The DTO containing creation fields.
   * @returns A promise resolving to the created Source entity.
   */
  createSource(data: CreateSourceDTO): Promise<Source> {
    return this.sourcesRepository.create(data);
  }

  /**
   * Retrieves a source by its ID.
   * Throws NotFoundError if the source is not active or doesn't exist.
   * @param id - The UUID of the source.
   * @returns A promise resolving to the Source entity.
   */
  getSourceById(id: string): Promise<Source> {
    return this.sourcesRepository.findById(id).then((source) => {
      if (!source) {
        throw sourceNotFound();
      }
      return source;
    });
  }

  /**
   * Updates an existing document source.
   * Throws NotFoundError if the source is not found.
   * @param id - The UUID of the source to update.
   * @param data - The DTO with the updated fields.
   * @returns A promise resolving to the updated Source entity.
   */
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

  /**
   * Soft-deletes a document source by ID.
   * Throws NotFoundError if the source does not exist.
   * @param id - The UUID of the source to delete.
   * @returns A promise resolving to void.
   */
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

  /**
   * Lists document sources matching filters and pagination.
   * @param filters - Active search filters.
   * @param order - Directional ordering parameters.
   * @param pagination - Limit and offset parameters.
   * @returns A promise resolving to the paginated list results.
   */
  listSources(
    filters?: ListSourcesFilters,
    order?: ListSourcesOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult> {
    return this.sourcesRepository.list(filters, order, pagination);
  }
}
