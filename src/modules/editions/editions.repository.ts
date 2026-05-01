import type { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IEditionsRepository } from './editions.repository.port';
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
import {
  applyFilters,
  applyOrder,
  applyPagination,
} from '../../infra/database/query-helpers';

export class EditionsRepository implements IEditionsRepository {
  constructor(private readonly db: Kysely<DB>) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEdition(row: any): Edition {
    return {
      id: row.id,
      source_id: row.source_id,
      number: row.number ?? null,
      published_at: row.published_at ? new Date(row.published_at) : null,
      notes: row.notes ?? null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEditionWithSource(row: any): EditionWithSource {
    return {
      ...this.mapToEdition(row),
      source_name: row.source_name,
      source_type: row.source_type,
      source_language: row.source_language,
    };
  }

  create(data: CreateEditionDTO): Promise<Edition> {
    return this.db
      .insertInto('editions')
      .values({
        source_id: data.sourceId,
        number: data.number,
        published_at: data.publishedAt,
        notes: data.notes,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
      .then((row) => this.mapToEdition(row));
  }

  findById(id: string): Promise<EditionWithSource | undefined> {
    return this.db
      .selectFrom('editions')
      .innerJoin('sources', 'sources.id', 'editions.source_id')
      .select([
        'editions.id',
        'editions.source_id',
        'editions.number',
        'editions.published_at',
        'editions.notes',
        'editions.created_at',
        'editions.updated_at',
        'editions.deleted_at',
        'sources.name as source_name',
        'sources.type as source_type',
        'sources.language as source_language',
      ])
      .where('editions.id', '=', id)
      .where('editions.deleted_at', 'is', null)
      .where('sources.deleted_at', 'is', null)
      .executeTakeFirst()
      .then((row) => (row ? this.mapToEditionWithSource(row) : undefined));
  }

  update(id: string, data: UpdateEditionDTO): Promise<Edition | undefined> {
    return this.db
      .updateTable('editions')
      .set({
        number: data.number,
        published_at: data.publishedAt,
        notes: data.notes,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst()
      .then((row) => (row ? this.mapToEdition(row) : undefined));
  }

  softDelete(id: string): Promise<boolean> {
    return this.db
      .updateTable('editions')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((res) => Number(res.numUpdatedRows) > 0);
  }

  list(
    filters?: ListEditionsFilters,
    order?: ListEditionsOrderParams,
    pagination?: PaginationParams,
  ): Promise<ListEditionsResult> {
    let query = this.db
      .selectFrom('editions')
      .innerJoin('sources', 'sources.id', 'editions.source_id')
      .where('editions.deleted_at', 'is', null)
      .where('sources.deleted_at', 'is', null);

    const columnMap: Record<string, string> = {
      source_id: 'editions.source_id',
      number: 'editions.number',
      published_at: 'editions.published_at',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyFilters(query, filters as any, columnMap);

    const orderColumnMap: Record<string, string> = {
      number: 'editions.number',
      published_at: 'editions.published_at',
      created_at: 'editions.created_at',
    };

    const countQuery = query.select((eb) =>
      eb.fn.count<number>('editions.id').as('total'),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = applyOrder(query, order as any, orderColumnMap);

    const dataQuery = applyPagination(query, pagination).select([
      'editions.id',
      'editions.source_id',
      'editions.number',
      'editions.published_at',
      'editions.notes',
      'editions.created_at',
      'editions.updated_at',
      'editions.deleted_at',
    ]);

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
        data: data.map((row) => this.mapToEdition(row)),
      };
    });
  }
}
