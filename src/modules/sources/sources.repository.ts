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

/**
 * Kysely-based database implementation of the document sources repository port.
 * Executes queries on the 'sources' table.
 */
export class SourcesRepository implements ISourcesRepository {
  constructor(private readonly db: Kysely<DB>) {}

  /**
   * Maps a database row object to the structured Source domain entity.
   * @param row - The raw query row result.
   * @returns The parsed Source entity.
   */
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

  /**
   * Creates a new document source and persists it.
   * @param data - The DTO containing name, type, language, and metadata.
   * @returns A promise resolving to the created Source.
   */
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

  /**
   * Retrieves a non-deleted document source by its ID.
   * @param id - The source UUID.
   * @returns A promise resolving to the Source if found, or undefined.
   */
  findById(id: string): Promise<Source | undefined> {
    return this.db
      .selectFrom('sources')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((row) => (row ? this.mapToSource(row) : undefined));
  }

  /**
   * Updates an existing document source with new fields.
   * @param id - The source UUID.
   * @param data - The updates to apply.
   * @returns A promise resolving to the updated Source, or undefined.
   */
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

  /**
   * Soft-deletes a document source by ID.
   * @param id - The source UUID.
   * @returns A promise resolving to true if deleted, false otherwise.
   */
  softDelete(id: string): Promise<boolean> {
    return this.db
      .updateTable('sources')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((res) => Number(res.numUpdatedRows) > 0);
  }

  /**
   * Lists document sources matching the criteria.
   * @param filters - Active search filters.
   * @param order - Directional ordering.
   * @param pagination - Page bounds parameters.
   * @returns A promise resolving to the paginated list results.
   */
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
