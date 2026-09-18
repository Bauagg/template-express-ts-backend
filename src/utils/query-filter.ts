import { Op, OrderItem, WhereOptions } from 'sequelize';
import { BadRequestError } from './app-error';

export type FilterOperator = 'equal' | 'notEqual' | 'like' | 'in' | 'gt' | 'gte' | 'lt' | 'lte';

export interface FilterCondition {
  key: string;
  operator: FilterOperator;
  value: unknown;
}

export interface SortCondition {
  key: string;
  order: 'asc' | 'desc';
}

const OPERATOR_MAP: Record<FilterOperator, symbol> = {
  equal: Op.eq,
  notEqual: Op.ne,
  like: Op.like,
  in: Op.in,
  gt: Op.gt,
  gte: Op.gte,
  lt: Op.lt,
  lte: Op.lte,
};

// parse query param JSON seperti ?filter=[{"key":"type_param","operator":"equal","value":"PAYMENT"}]
export const parseJsonArrayQuery = <T>(raw: unknown, paramName: string): T[] => {
  if (raw === undefined || raw === null || raw === '') return [];

  if (typeof raw !== 'string') {
    throw new BadRequestError(`${paramName} harus berupa JSON array yang valid`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadRequestError(`${paramName} harus berupa JSON array yang valid`);
  }

  if (!Array.isArray(parsed)) {
    throw new BadRequestError(`${paramName} harus berupa JSON array`);
  }

  return parsed as T[];
};

export const parseFilterQuery = (raw: unknown): FilterCondition[] => {
  const items = parseJsonArrayQuery<FilterCondition>(raw, 'filter');

  return items.map((item) => {
    if (!item || typeof item.key !== 'string' || typeof item.operator !== 'string' || !(item.operator in OPERATOR_MAP)) {
      throw new BadRequestError('filter tidak valid, wajib berisi key dan operator yang didukung');
    }
    return item;
  });
};

// parse query param sederhana seperti ?sort=created_at&order=asc
export const parseSortQuery = (sort: unknown, order: unknown): SortCondition | null => {
  if (sort === undefined || sort === null || sort === '') return null;

  if (typeof sort !== 'string') {
    throw new BadRequestError('Validasi gagal', [
      { field: 'sort', message: 'sort harus berupa nama kolom' },
    ]);
  }

  const orderValue = typeof order === 'string' ? order.toLowerCase() : 'asc';
  if (orderValue !== 'asc' && orderValue !== 'desc') {
    throw new BadRequestError('Validasi gagal', [
      { field: 'order', message: "order harus 'asc' atau 'desc'" },
    ]);
  }

  return { key: sort, order: orderValue };
};

const assertAllowedKey = (key: string, allowedKeys: readonly string[]): void => {
  if (!allowedKeys.includes(key)) {
    throw new BadRequestError(`Kolom '${key}' tidak dapat difilter/diurutkan`);
  }
};

// bangun WhereOptions dari filter conditions, hanya untuk kolom yang ada di allowedKeys
export const buildWhereFromFilters = <T extends object = any>(
  filters: FilterCondition[],
  allowedKeys: readonly string[]
): WhereOptions<T> => {
  const where: Record<string | symbol, unknown> = {};

  for (const { key, operator, value } of filters) {
    assertAllowedKey(key, allowedKeys);
    const opSymbol = OPERATOR_MAP[operator];

    if (operator === 'like') {
      where[key] = { [opSymbol]: `%${value}%` };
    } else if (operator === 'in') {
      where[key] = { [opSymbol]: Array.isArray(value) ? value : [value] };
    } else {
      where[key] = { [opSymbol]: value };
    }
  }

  return where as WhereOptions<T>;
};

// bangun Order sequelize dari 1 sort condition, hanya untuk kolom yang ada di allowedKeys
export const buildOrderFromSort = (sort: SortCondition | null, allowedKeys: readonly string[]): OrderItem[] => {
  if (!sort) return [];

  assertAllowedKey(sort.key, allowedKeys);
  return [[sort.key, sort.order.toUpperCase()] as OrderItem];
};
