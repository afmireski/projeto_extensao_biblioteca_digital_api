export type Filters = Record<string, FilterRelation<unknown>>;

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

export type TextFilter<T> = Pick<
  FilterRelation<T>,
  'eq' | 'ne' | 'like' | 'in' | 'nin'
>;

export type ValueFilter<T> = Pick<
  FilterRelation<T>,
  'eq' | 'ne' | 'gte' | 'gt' | 'lte' | 'lt'
>;

export type EnumFilter<T> = Pick<FilterRelation<T>, 'eq' | 'ne' | 'in' | 'nin'>;

export type EqualFilter<T> = Pick<FilterRelation<T>, 'eq'>;

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type OrderParams = Record<string, 'asc' | 'desc'>;
