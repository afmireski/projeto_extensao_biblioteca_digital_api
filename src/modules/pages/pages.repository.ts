import type { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IPagesRepository } from './pages.repository.port';
import type {
  CreatePageDTO,
  PageEntity,
  ListPagesFilters,
  ListPagesOrderParams,
} from './pages.types';
import type { PaginationParams } from '../../shared/types/query';
import {
  applyFilters,
  applyOrder,
  applyPagination,
} from '../../infra/database/query-helpers';

/**
 * Kysely-based database implementation of the pages repository port.
 * Executes queries on the 'pages' table.
 */
export class PagesRepository implements IPagesRepository {
  constructor(private readonly db: Kysely<DB>) {}

  /**
   * Maps a database row object to the structured PageEntity domain entity.
   * @param row - The raw query row result.
   * @returns The parsed PageEntity.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToPage(row: any): PageEntity {
    return {
      id: row.id,
      edition_id: row.edition_id,
      number: row.number,
      original_image_path: row.original_image_path,
      display_image_path: row.display_image_path ?? null,
      thumb_image_path: row.thumb_image_path ?? null,
      ocr_status: row.ocr_status,
      ocr_confidence: row.ocr_confidence ?? null,
    };
  }

  /**
   * Persists a new page in the database.
   * @param page - The DTO containing paths and parameters.
   * @returns A promise resolving to the created PageEntity.
   */
  create(page: CreatePageDTO): Promise<PageEntity> {
    return this.db
      .insertInto('pages')
      .values(page)
      .returningAll()
      .executeTakeFirstOrThrow()
      .then((row) => this.mapToPage(row));
  }

  /**
   * Lists pages matching filters and pagination.
   * Defaults ordering to page number ascending.
   * @param filters - Search filters.
   * @param order - Directional ordering params.
   * @param pagination - Limit and offset bounds.
   * @returns A promise resolving to list of pages and total count.
   */
  list(
    filters?: ListPagesFilters,
    order?: ListPagesOrderParams,
    pagination?: PaginationParams,
  ): Promise<{ data: PageEntity[]; total: number }> {
    let query = this.db
      .selectFrom('pages')
      .where('pages.deleted_at', 'is', null);

    const columnMap: Record<string, string> = {
      edition_id: 'pages.edition_id',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyFilters(query, filters as any, columnMap);

    const orderColumnMap: Record<string, string> = {
      number: 'pages.number',
    };

    const appliedOrder =
      order && Object.keys(order).length > 0 ? order : { number: 'asc' };

    const countQuery = query.select((eb) =>
      eb.fn.count<number>('pages.id').as('total'),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyOrder(query, appliedOrder as any, orderColumnMap);

    const dataQuery = applyPagination(query, pagination).select([
      'pages.id',
      'pages.edition_id',
      'pages.number',
      'pages.original_image_path',
      'pages.display_image_path',
      'pages.thumb_image_path',
      'pages.ocr_status',
      'pages.ocr_confidence',
    ]);

    return Promise.all([
      countQuery.executeTakeFirst(),
      dataQuery.execute(),
    ]).then(([countResult, data]) => ({
      total: Number(countResult?.total || 0),
      data: data.map((row) => this.mapToPage(row)),
    }));
  }

  /**
   * Physically deletes multiple page records by their IDs and edition ID.
   * @param editionId - The UUID of the edition.
   * @param pageIds - Array of page UUIDs.
   * @returns A promise resolving to the deleted PageEntity records.
   */
  deleteManyByIdsAndEditionId(
    editionId: string,
    pageIds: string[],
  ): Promise<PageEntity[]> {
    return this.db
      .deleteFrom('pages')
      .where('id', 'in', pageIds)
      .where('edition_id', '=', editionId)
      .returning([
        'id',
        'edition_id',
        'number',
        'original_image_path',
        'display_image_path',
        'thumb_image_path',
        'ocr_status',
        'ocr_confidence',
      ])
      .execute();
  }

  /**
   * Validates if a page can be uploaded to a specific edition.
   * Checks that the parent edition exists and that page number is not already taken.
   * @param editionId - Target edition UUID.
   * @param pageNumber - The sequential page number to check.
   * @returns A promise resolving to check outcomes.
   */
  checkIfCanUpload(
    editionId: string,
    pageNumber: number,
  ): Promise<{ hasEdition: boolean; pageNumberConflicts: boolean }> {
    return Promise.all([
      this.db
        .selectFrom('editions')
        .select('id')
        .where('id', '=', editionId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      this.db
        .selectFrom('pages')
        .select('id')
        .where('edition_id', '=', editionId)
        .where('number', '=', pageNumber)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
    ]).then(([edition, page]) => ({
      hasEdition: !!edition,
      pageNumberConflicts: !!page,
    }));
  }
}
