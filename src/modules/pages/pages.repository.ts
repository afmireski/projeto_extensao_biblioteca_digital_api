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

export class PagesRepository implements IPagesRepository {
  constructor(private readonly db: Kysely<DB>) {}

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

  create(page: CreatePageDTO): Promise<PageEntity> {
    return this.db
      .insertInto('pages')
      .values(page)
      .returningAll()
      .executeTakeFirstOrThrow()
      .then((row) => this.mapToPage(row));
  }

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

  deleteManyByIds(pageIds: string[]): Promise<PageEntity[]> {
    return this.db
      .deleteFrom('pages')
      .where('id', 'in', pageIds)
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
