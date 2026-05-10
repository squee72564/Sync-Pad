import { DbError } from '@syncpad/errors';

export type CursorPaginationInput = {
  limit: number;
  cursor?: string;
};

export type SearchInput = {
  q?: string;
};

export type SearchableCursorPaginationInput = SearchInput & {
  pagination: CursorPaginationInput;
};

export type PageInfo = {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type UpdatedAtIdCursor = {
  updatedAt: Date;
  id: string;
};

export type PaginatedResult<TItemsKey extends string, TItem> = Record<
  TItemsKey,
  TItem[]
> & {
  pageInfo: PageInfo;
};

function assertCursorPayload(
  value: unknown,
): asserts value is { updatedAt: string; id: string } {
  if (
    !value ||
    typeof value !== 'object' ||
    !('updatedAt' in value) ||
    !('id' in value) ||
    typeof value.updatedAt !== 'string' ||
    typeof value.id !== 'string'
  ) {
    throw new DbError({
      code: 'INVALID_PAGINATION_CURSOR',
      expose: true,
      kind: 'validation',
      message: 'Invalid pagination cursor.',
      userMessage: 'Invalid pagination cursor.',
    });
  }
}

export const encodeUpdatedAtIdCursor = (input: UpdatedAtIdCursor) =>
  Buffer.from(
    JSON.stringify({
      updatedAt: input.updatedAt.toISOString(),
      id: input.id,
    }),
    'utf8',
  ).toString('base64url');

export const decodeUpdatedAtIdCursor = (
  cursor: string | undefined,
): UpdatedAtIdCursor | undefined => {
  if (!cursor) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch (error) {
    throw new DbError({
      cause: error,
      code: 'INVALID_PAGINATION_CURSOR',
      expose: true,
      kind: 'validation',
      message: 'Invalid pagination cursor.',
      userMessage: 'Invalid pagination cursor.',
    });
  }

  assertCursorPayload(parsed);

  const updatedAt = new Date(parsed.updatedAt);

  if (Number.isNaN(updatedAt.getTime())) {
    throw new DbError({
      code: 'INVALID_PAGINATION_CURSOR',
      expose: true,
      kind: 'validation',
      message: 'Invalid pagination cursor.',
      userMessage: 'Invalid pagination cursor.',
    });
  }

  return {
    updatedAt,
    id: parsed.id,
  };
};

export const createPageInfo = <TItem extends { id: string; updatedAt: Date }>({
  items,
  hasNextPage,
  limit,
}: {
  items: TItem[];
  hasNextPage: boolean;
  limit: number;
}): PageInfo => {
  const lastItem = items.at(-1);

  return {
    limit,
    hasNextPage,
    nextCursor:
      hasNextPage && lastItem
        ? encodeUpdatedAtIdCursor({
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          })
        : null,
  };
};
