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

/**
 * Repository interface for managing source editions (e.g., issues of newspapers).
 * Defines actions to create, find, update, soft-delete, and list editions.
 */
export interface IEditionsRepository {
  /**
   * Creates a new edition of a document source.
   * @param data - The DTO containing the creation fields.
   * @returns A promise resolving to the created Edition entity.
   */
  create(data: CreateEditionDTO): Promise<Edition>;

  /**
   * Finds an active (non-deleted) edition by its ID, enriched with its source details.
   * @param id - The UUID of the edition.
   * @returns A promise resolving to the EditionWithSource, or undefined.
   */
  findById(id: string): Promise<EditionWithSource | undefined>;

  /**
   * Updates an existing edition's fields.
   * @param id - The UUID of the edition to update.
   * @param data - The DTO containing fields to update.
   * @returns A promise resolving to the updated Edition, or undefined if not found.
   */
  update(id: string, data: UpdateEditionDTO): Promise<Edition | undefined>;

  /**
   * Soft-deletes an edition.
   * @param id - The UUID of the edition to delete.
   * @returns A promise resolving to true if deleted, false otherwise.
   */
  softDelete(id: string): Promise<boolean>;

  /**
   * Lists editions matching filters, ordering parameters, and pagination.
   * @param filters - Active search filters.
   * @param order - Directional ordering criteria.
   * @param pagination - Limit and offset params.
   * @returns A promise resolving to the paginated list results.
   */
  list(
    filters?: ListEditionsFilters,
    order?: ListEditionsOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListEditionsResult>;
}
