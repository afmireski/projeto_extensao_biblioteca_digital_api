import type {
  CreatePageDTO,
  PageEntity,
  ListPagesFilters,
  ListPagesOrderParams,
} from './pages.types';
import type { PaginationParams } from '../../shared/types/query';

/**
 * Repository interface for managing source pages (images and OCR results).
 * Defines methods to create, list, delete, and check upload feasibility of pages.
 */
export interface IPagesRepository {
  /**
   * Inserts and persists a new page record.
   * @param page - The DTO containing the page file details.
   * @returns A promise resolving to the created PageEntity.
   */
  create(page: CreatePageDTO): Promise<PageEntity>;

  /**
   * Lists pages matching criteria.
   * @param filters - Search filters.
   * @param order - Ordering params.
   * @param pagination - Pagination bounds.
   * @returns A promise resolving to an object containing the list of pages and total count.
   */
  list(
    filters?: ListPagesFilters,
    order?: ListPagesOrderParams,
    pagination?: PaginationParams,
  ): Promise<{ data: PageEntity[]; total: number }>;

  /**
   * Physically deletes multiple page records by their IDs and edition ID.
   * @param editionId - The UUID of the edition.
   * @param pageIds - Array of page UUIDs.
   * @returns A promise resolving to the list of deleted PageEntity records.
   */
  deleteManyByIdsAndEditionId(
    editionId: string,
    pageIds: string[],
  ): Promise<PageEntity[]>;

  /**
   * Performs check validations (checks parent existence and page number conflicts) before upload.
   * @param editionId - The target edition UUID.
   * @param pageNumber - The sequential page number to check.
   * @returns A promise resolving to an object indicating parent existence and number conflicts.
   */
  checkIfCanUpload(
    editionId: string,
    pageNumber: number,
  ): Promise<{ hasEdition: boolean; pageNumberConflicts: boolean }>;
}
