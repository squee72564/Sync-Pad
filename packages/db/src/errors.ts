import { DbError, isSyncpadError, type SyncpadError } from '@syncpad/errors';

export type DbErrorContext = {
  entity?: string;
  operation: string;
};

type PostgresErrorLike = Error & {
  code: string;
  column?: string;
  constraint?: string;
  schema?: string;
  table?: string;
};

const isPostgresErrorLike = (value: unknown): value is PostgresErrorLike =>
  value instanceof Error &&
  typeof (value as PostgresErrorLike).code === 'string';

const findPostgresErrorLike = (value: unknown): PostgresErrorLike | null => {
  let current = value;

  while (current instanceof Error) {
    if (isPostgresErrorLike(current)) {
      return current;
    }

    current = current.cause;
  }

  return null;
};

const getSqlStateClass = (sqlState: string) => sqlState.slice(0, 2);

export const toDbError = (
  error: unknown,
  context: DbErrorContext,
): DbError | SyncpadError => {
  if (isSyncpadError(error)) {
    return error;
  }

  const postgresError = findPostgresErrorLike(error);

  const metadata = {
    entity: context.entity,
    operation: context.operation,
    ...(postgresError
      ? {
          column: postgresError.column,
          constraint: postgresError.constraint,
          schema: postgresError.schema,
          sqlState: postgresError.code,
          table: postgresError.table,
        }
      : {}),
  };

  if (!postgresError) {
    return new DbError({
      cause: error,
      code: 'DATABASE_OPERATION_FAILED',
      kind: 'dependency_unavailable',
      message: 'Database operation failed',
      metadata,
    });
  }

  const sqlState = postgresError.code;

  switch (sqlState) {
    case '23505':
      return new DbError({
        cause: error,
        code: 'DATABASE_UNIQUE_CONSTRAINT_VIOLATION',
        kind: 'conflict',
        message: 'Database unique constraint violation',
        metadata,
      });
    case '23503':
      return new DbError({
        cause: error,
        code: 'DATABASE_FOREIGN_KEY_VIOLATION',
        kind: 'conflict',
        message: 'Database foreign key constraint violation',
        metadata,
      });
    case '23502':
      return new DbError({
        cause: error,
        code: 'DATABASE_NOT_NULL_VIOLATION',
        kind: 'validation',
        message: 'Database not-null constraint violation',
        metadata,
      });
    case '40001':
    case '40P01':
      return new DbError({
        cause: error,
        code: 'DATABASE_TRANSACTION_RETRYABLE',
        kind: 'dependency_unavailable',
        message: 'Database transaction failed with a retryable error',
        metadata,
        retryable: true,
      });
    case '53300':
    case '57P01':
    case '57P02':
    case '57P03':
      return new DbError({
        cause: error,
        code: 'DATABASE_UNAVAILABLE',
        kind: 'dependency_unavailable',
        message: 'Database is unavailable',
        metadata,
        retryable: true,
      });
    case '57014':
      return new DbError({
        cause: error,
        code: 'DATABASE_QUERY_CANCELLED',
        kind: 'dependency_unavailable',
        message: 'Database query was cancelled',
        metadata,
        retryable: true,
      });
  }

  if (getSqlStateClass(sqlState) === '08') {
    return new DbError({
      cause: error,
      code: 'DATABASE_UNAVAILABLE',
      kind: 'dependency_unavailable',
      message: 'Database is unavailable',
      metadata,
      retryable: true,
    });
  }

  if (getSqlStateClass(sqlState) === '22') {
    return new DbError({
      cause: error,
      code: 'DATABASE_DATA_EXCEPTION',
      kind: 'validation',
      message: 'Database rejected invalid data',
      metadata,
    });
  }

  return new DbError({
    cause: error,
    code: 'DATABASE_OPERATION_FAILED',
    kind: 'dependency_unavailable',
    message: 'Database operation failed',
    metadata,
  });
};

export const withDbError = async <T>(
  context: DbErrorContext,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw toDbError(error, context);
  }
};
