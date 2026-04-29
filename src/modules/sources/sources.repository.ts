import type { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { ISourcesRepository } from './sources.repository.port';
import type {
  Source,
  CreateSourceDTO,
  UpdateSourceDTO,
  ListSourcesFilters,
  ListSourcesOrderParams,
  ListSourcesResult,
} from './sources.types';
import type { PaginationParams } from '../../shared/types/query';
import {
  applyFilters,
  applyOrder,
  applyPagination,
} from '../../infra/database/query-helpers';

export class SourcesRepository implements ISourcesRepository {
  constructor(private readonly db: Kysely<DB>) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSource(row: any): Source {
    return {
      id: row.id,
      collection_id: row.collection_id,
      name: row.name,
      type: row.type,
      language: row.language,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata || {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  create(data: CreateSourceDTO): Promise<Source> {
    return this.db
      .insertInto('sources')
      .values({
        collection_id: data.collectionId,
        name: data.name,
        type: data.type,
        language: data.language,
        metadata: JSON.stringify(data.metadata),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
      .then((row) => this.mapToSource(row));
  }

  findById(id: string): Promise<Source | undefined> {
    return this.db
      .selectFrom('sources')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((row) => (row ? this.mapToSource(row) : undefined));
  }

  update(id: string, data: UpdateSourceDTO): Promise<Source | undefined> {
    return this.db
      .updateTable('sources')
      .set({
        collection_id: data.collectionId,
        name: data.name,
        type: data.type,
        language: data.language,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst()
      .then((row) => (row ? this.mapToSource(row) : undefined));
  }

  softDelete(id: string): Promise<boolean> {
    return this.db
      .updateTable('sources')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((res) => Number(res.numUpdatedRows) > 0);
  }

  list(
    filters?: ListSourcesFilters,
    order?: ListSourcesOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListSourcesResult> {
    let query = this.db.selectFrom('sources').where('deleted_at', 'is', null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyFilters(query, filters as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyOrder(query, order as any);

    const countQuery = query.select((eb) =>
      eb.fn.count<number>('id').as('total'),
    );

    query = applyPagination(query, pagination);
    const dataQuery = query.selectAll();

    return Promise.all([
      countQuery.executeTakeFirst(),
      dataQuery.execute(),
    ]).then(([countResult, data]) => {
      const total = Number(countResult?.total || 0);
      return {
        metadata: {
          total,
          page: pagination?.page || 1,
          limit: pagination?.limit || data.length,
        },
        data: data.map((row) => this.mapToSource(row)),
      };
    });
  }
}
