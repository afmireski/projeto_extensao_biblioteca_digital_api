import type { PaginationParams } from '../../shared/types/query';
import type {
  CreateSourceDTO,
  ListSourcesResult,
  Source,
  UpdateSourceDTO,
  ListSourcesFilters,
  ListSourcesOrderParams,
} from './sources.types';

/**
 * Repository interface for managing document sources (newspapers, magazines, books).
 * Outlines methods to create, find, update, soft-delete, and list sources.
 */
export interface ISourcesRepository {
  /**
   * Creates and persists a new document source.
   * @param data - The DTO containing the source's fields.
   * @returns A promise resolving to the created Source entity.
   */
  create(data: CreateSourceDTO): Promise<Source>;

  /**
   * Finds an active (non-deleted) source by its unique ID.
   * @param id - The UUID of the source.
   * @returns A promise resolving to the Source, or undefined if not found.
   */
  findById(id: string): Promise<Source | undefined>;

  /**
   * Updates an existing source's properties.
   * @param id - The UUID of the source to update.
   * @param data - The DTO containing fields to update.
   * @returns A promise resolving to the updated Source, or undefined if not found.
   */
  update(id: string, data: UpdateSourceDTO): Promise<Source | undefined>;

  /**
   * Soft-deletes a source by marking its deleted_at timestamp.
   * @param id - The UUID of the source to soft-delete.
   * @returns A promise resolving to true if updated, false otherwise.
   */
  softDelete(id: string): Promise<boolean>;

  /**
   * Lists sources matching filters, ordering parameters, and pagination bounds.
   * @param filters - The filter criteria object.
   * @param order - The ordering direction object.
   * @param pagination - Page size and offset values.
   * @returns A promise resolving to the paginated list results.
   */
  list(
    filters?: ListSourcesFilters,
    order?: ListSourcesOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult>;
}
