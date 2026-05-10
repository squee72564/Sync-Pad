import type { SearchablePageParamsDto } from '@syncpad/types';

export type ListQuerySearch = SearchablePageParamsDto;

const toOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalLimit = (value: unknown) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const parseListQuerySearch = (
  search: Record<string, unknown>,
): ListQuerySearch => ({
  q: toOptionalString(search.q),
  limit: toOptionalLimit(search.limit),
  cursor: toOptionalString(search.cursor),
});

export const withListQuerySearch = (
  current: ListQuerySearch,
  q: string,
): ListQuerySearch => {
  const nextQ = toOptionalString(q);
  const currentQ = toOptionalString(current.q);

  if (nextQ === currentQ) {
    return current;
  }

  return {
    ...current,
    q: nextQ,
    cursor: undefined,
  };
};

export const toListQueryString = (search: ListQuerySearch = {}) => {
  const params = new URLSearchParams();

  if (search.q) {
    params.set('q', search.q);
  }

  if (search.limit !== undefined) {
    params.set('limit', String(search.limit));
  }

  if (search.cursor) {
    params.set('cursor', search.cursor);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};
