import type { SelectQueryBuilder, StringReference } from 'kysely';
import type {
  Filters,
  OrderParams,
  PaginationParams,
} from '../../shared/types/query';

export function applyPagination<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  pagination?: PaginationParams,
): SelectQueryBuilder<DB, TB, O> {
  if (!pagination) return qb;
  return qb.limit(pagination.limit).offset(pagination.offset);
}

export function applyOrder<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  order?: OrderParams,
): SelectQueryBuilder<DB, TB, O> {
  if (!order || Object.keys(order).length === 0) return qb;
  let query = qb;
  for (const [column, direction] of Object.entries(order)) {
    query = query.orderBy(column as StringReference<DB, TB>, direction);
  }
  return query;
}

export function applyFilters<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  filters?: Filters,
): SelectQueryBuilder<DB, TB, O> {
  if (!filters || Object.keys(filters).length === 0) return qb;

  let query = qb;

  for (const [column, operations] of Object.entries(filters)) {
    if (!operations) continue;

    for (const [op, value] of Object.entries(operations)) {
      if (value === undefined) continue;

      const colRef = column as StringReference<DB, TB>;

      switch (op) {
        case 'eq':
          query = query.where(colRef, '=', value);
          break;
        case 'ne':
          query = query.where(colRef, '!=', value);
          break;
        case 'in':
          query = query.where(colRef, 'in', value);
          break;
        case 'nin':
          query = query.where(colRef, 'not in', value);
          break;
        case 'like':
          query = query.where(colRef, 'ilike', value);
          break;
        case 'gte':
          query = query.where(colRef, '>=', value);
          break;
        case 'gt':
          query = query.where(colRef, '>', value);
          break;
        case 'lte':
          query = query.where(colRef, '<=', value);
          break;
        case 'lt':
          query = query.where(colRef, '<', value);
          break;
      }
    }
  }

  return query;
}
