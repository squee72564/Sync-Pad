import { DbError, SyncpadError } from '@syncpad/errors';
import { describe, expect, it } from 'vitest';

import { toDbError, withDbError } from '../src/errors.js';

const pgError = (code: string, fields?: Record<string, unknown>) =>
  Object.assign(new Error(`pg ${code}`), { code, ...fields });

describe('db error normalization', () => {
  it.each([
    ['23505', 'DATABASE_UNIQUE_CONSTRAINT_VIOLATION', 'conflict', false],
    ['23503', 'DATABASE_FOREIGN_KEY_VIOLATION', 'conflict', false],
    ['23502', 'DATABASE_NOT_NULL_VIOLATION', 'validation', false],
    ['22001', 'DATABASE_DATA_EXCEPTION', 'validation', false],
    ['08006', 'DATABASE_UNAVAILABLE', 'dependency_unavailable', true],
    ['53300', 'DATABASE_UNAVAILABLE', 'dependency_unavailable', true],
    ['57014', 'DATABASE_QUERY_CANCELLED', 'dependency_unavailable', true],
    ['40001', 'DATABASE_TRANSACTION_RETRYABLE', 'dependency_unavailable', true],
    ['40P01', 'DATABASE_TRANSACTION_RETRYABLE', 'dependency_unavailable', true],
    ['99999', 'DATABASE_OPERATION_FAILED', 'dependency_unavailable', false],
  ])('maps SQLSTATE %s to %s', (sqlState, code, kind, retryable) => {
    const error = toDbError(pgError(sqlState), {
      entity: 'workspace',
      operation: 'insertWorkspace',
    });

    expect(error).toBeInstanceOf(DbError);
    expect(error).toMatchObject({
      code,
      kind,
      retryable,
      metadata: {
        entity: 'workspace',
        operation: 'insertWorkspace',
        sqlState,
      },
    });
  });

  it('keeps safe postgres metadata', () => {
    const error = toDbError(
      pgError('23505', {
        column: 'email',
        constraint: 'user_email_unique',
        schema: 'public',
        table: 'user',
      }),
      { entity: 'user', operation: 'insertUser' },
    );

    expect(error.metadata).toMatchObject({
      column: 'email',
      constraint: 'user_email_unique',
      schema: 'public',
      table: 'user',
    });
  });

  it('does not double-wrap shared errors', async () => {
    const existing = new SyncpadError({
      code: 'EXISTING',
      kind: 'validation',
      message: 'Existing error',
    });

    await expect(
      withDbError({ operation: 'test' }, async () => {
        throw existing;
      }),
    ).rejects.toBe(existing);
  });
});
