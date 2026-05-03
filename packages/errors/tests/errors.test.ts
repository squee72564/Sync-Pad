import { describe, expect, it } from 'vitest';

import {
  CoreError,
  DbError,
  isCoreError,
  isDbError,
  isPermifyError,
  isSyncpadError,
  PermifyError,
  SyncpadError,
  toSyncpadError,
} from '../src/index.js';

describe('SyncpadError', () => {
  it('preserves structured fields and cause', () => {
    const cause = new Error('down');
    const error = new SyncpadError({
      cause,
      code: 'DEPENDENCY_DOWN',
      details: { dependency: 'permify' },
      domain: 'permify',
      expose: false,
      kind: 'dependency_unavailable',
      message: 'Dependency failed',
      metadata: { operation: 'checkPermission' },
      retryable: true,
      tags: ['authz'],
      userMessage: 'Authorization is unavailable.',
    });

    expect(error.code).toBe('DEPENDENCY_DOWN');
    expect(error.kind).toBe('dependency_unavailable');
    expect(error.domain).toBe('permify');
    expect(error.cause).toBe(cause);
    expect(error.retryable).toBe(true);
    expect(error.tags).toEqual(['authz']);
  });

  it('identifies subclasses with guards', () => {
    const coreError = new CoreError({
      code: 'CORE_FAILED',
      kind: 'invariant_violation',
      message: 'Core failed',
    });
    const dbError = new DbError({
      code: 'DB_FAILED',
      kind: 'dependency_unavailable',
      message: 'DB failed',
    });
    const permifyError = new PermifyError({
      code: 'PERMIFY_FAILED',
      kind: 'dependency_unavailable',
      message: 'Permify failed',
    });

    expect(isSyncpadError(coreError)).toBe(true);
    expect(isCoreError(coreError)).toBe(true);
    expect(isDbError(dbError)).toBe(true);
    expect(isPermifyError(permifyError)).toBe(true);
  });

  it('normalizes unknown thrown values', () => {
    const existing = new CoreError({
      code: 'EXISTING',
      kind: 'validation',
      message: 'Existing',
    });
    const source = new Error('socket hang up');

    expect(
      toSyncpadError(existing, {
        code: 'FALLBACK',
        kind: 'dependency_unavailable',
      }),
    ).toBe(existing);

    expect(
      toSyncpadError(source, {
        code: 'FALLBACK',
        kind: 'dependency_unavailable',
      }),
    ).toMatchObject({
      cause: source,
      code: 'FALLBACK',
      message: 'socket hang up',
    });

    expect(
      toSyncpadError('boom', {
        code: 'FALLBACK',
        kind: 'dependency_unavailable',
      }).metadata,
    ).toEqual({ thrownValue: 'boom' });
  });
});
