/**
 * Map representing multiple field filters where keys are field names.
 */
export type Filters = Record<string, FilterRelation<unknown>>;

/**
 * Interface detailing query condition operations like equality, inequality, inclusion, or bounds.
 */
export interface FilterRelation<T> {
  eq?: T;
  ne?: T;
  in?: T[];
  nin?: T[];
  like?: T;
  gte?: T;
  gt?: T;
  lte?: T;
  lt?: T;
}

/**
 * Filter operations allowed on textual fields.
 */
export type TextFilter<T> = Pick<
  FilterRelation<T>,
  'eq' | 'ne' | 'like' | 'in' | 'nin'
>;

/**
 * Filter operations allowed on numeric or date value fields.
 */
export type ValueFilter<T> = Pick<
  FilterRelation<T>,
  'eq' | 'ne' | 'gte' | 'gt' | 'lte' | 'lt'
>;

/**
 * Filter operations allowed on enumerable type fields.
 */
export type EnumFilter<T> = Pick<FilterRelation<T>, 'eq' | 'ne' | 'in' | 'nin'>;

/**
 * Filter operation limited strictly to equality.
 */
export type EqualFilter<T> = Pick<FilterRelation<T>, 'eq'>;

/**
 * Pagination details parsed from query parameters.
 */
export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

/**
 * Sorting criteria where keys are field names and values are direction ('asc' or 'desc').
 */
export type OrderParams = Record<string, 'asc' | 'desc'>;
