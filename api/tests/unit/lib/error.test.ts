import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';

import { AppError, isAppError, toAppError } from '../../../src/lib/error.js';

describe('AppError', () => {
  it('preserves structured fields and log context', () => {
    const cause = new Error('database offline');
    const error = new AppError({
      cause,
      code: 'ORG_LOOKUP_FAILED',
      details: { orgId: 'org_123' },
      message: 'Failed to load organization record',
      metadata: { queryName: 'findOrganizationById' },
      requestId: 'req_123',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      tags: ['org', 'db'],
      userMessage: 'Unable to load organization.',
    });

    expect(error.code).toBe('ORG_LOOKUP_FAILED');
    expect(error.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(error.message).toBe('Failed to load organization record');
    expect(error.cause).toBe(cause);
    expect(error.tags).toEqual(['org', 'db']);
    expect(error.metadata).toEqual({ queryName: 'findOrganizationById' });
    expect(error.requestId).toBe('req_123');
    expect(error.toLogObject().stack).toBe(error.stack);
  });

  it('exposes debug detail by default in development', () => {
    const error = new AppError({
      code: 'TASK_CREATE_FAILED',
      details: { field: 'title' },
      message: 'Task title exceeded column width',
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    });

    expect(error.toProblem('development')).toEqual({
      code: 'TASK_CREATE_FAILED',
      detail: 'Task title exceeded column width',
      details: { field: 'title' },
      instance: undefined,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      title: 'Unprocessable Entity',
      type: 'urn:syncpad:error:task-create-failed',
    });
  });

  it('suppresses internal detail in production by default', () => {
    const error = new AppError({
      code: 'INTERNAL_ERROR',
      details: { queryName: 'insertDocument' },
      message: 'violated unique constraint documents_slug_key',
      metadata: { table: 'documents' },
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });

    expect(error.toProblem('production')).toEqual({
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected error occurred.',
      details: undefined,
      instance: undefined,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      type: 'urn:syncpad:error:internal-error',
    });
  });

  it('allows explicit safe exposure in production', () => {
    const error = new AppError({
      code: 'AUTH_INVALID_CREDENTIALS',
      details: { reason: 'invalid_credentials' },
      expose: true,
      message: 'Password mismatch for user',
      status: StatusCodes.UNAUTHORIZED,
      userMessage: 'Invalid email or password.',
    });

    expect(error.toProblem('production')).toEqual({
      code: 'AUTH_INVALID_CREDENTIALS',
      detail: 'Invalid email or password.',
      details: { reason: 'invalid_credentials' },
      instance: undefined,
      status: StatusCodes.UNAUTHORIZED,
      title: 'Unauthorized',
      type: 'urn:syncpad:error:auth-invalid-credentials',
    });
  });
});

describe('toAppError', () => {
  it('returns the same AppError instance', () => {
    const error = new AppError({
      code: 'NOT_FOUND',
      message: 'Document not found',
      status: StatusCodes.NOT_FOUND,
    });

    expect(toAppError(error)).toBe(error);
    expect(isAppError(error)).toBe(true);
  });

  it('normalizes native errors to INTERNAL_ERROR by default', () => {
    const source = new Error('socket hang up');
    const error = toAppError(source);

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.message).toBe('socket hang up');
    expect(error.cause).toBe(source);
    expect(error.toProblem('production').detail).toBe(
      'An unexpected error occurred.',
    );
  });

  it('normalizes non-error throws and captures metadata', () => {
    const error = toAppError('boom');

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.message).toBe('Non-error value thrown');
    expect(error.metadata).toEqual({ thrownValue: 'boom' });
    expect(error.toProblem('production').detail).toBe(
      'An unexpected error occurred.',
    );
  });
});
