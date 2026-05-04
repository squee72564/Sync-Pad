import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/lib/error.js';
import { createTestApp } from '../helpers/test-deps.js';

describe('app error handling', () => {
  it('returns canonical not found responses', async () => {
    const app = createTestApp();
    const response = await app.request('/missing-route');
    const body = (await response.json()) as { requestId: string };

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(body).toEqual({
      code: 'ROUTE_NOT_FOUND',
      detail: 'The requested resource was not found.',
      instance: '/missing-route',
      requestId: expect.any(String),
      status: StatusCodes.NOT_FOUND,
      title: 'Not Found',
      type: 'urn:syncpad:error:route-not-found',
    });
  });

  it('normalizes thrown ApiError instances', async () => {
    const app = createTestApp();
    app.get('/__test/app-error', () => {
      throw new ApiError({
        code: 'TEST_ERROR',
        expose: true,
        message: 'app error route failed',
        status: StatusCodes.IM_A_TEAPOT,
        userMessage: 'Intentional test failure.',
      });
    });

    const response = await app.request('/__test/app-error');
    const body = (await response.json()) as { requestId: string };

    expect(response.status).toBe(StatusCodes.IM_A_TEAPOT);
    expect(body).toEqual({
      code: 'TEST_ERROR',
      detail: 'Intentional test failure.',
      instance: '/__test/app-error',
      requestId: expect.any(String),
      status: StatusCodes.IM_A_TEAPOT,
      title: "I'm a teapot",
      type: 'urn:syncpad:error:test-error',
    });
  });

  it('normalizes native thrown errors into internal errors', async () => {
    const app = createTestApp();
    app.get('/__test/native-error', () => {
      throw new Error('boom');
    });

    const response = await app.request('/__test/native-error');
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({
      code: 'INTERNAL_ERROR',
      detail: 'boom',
      instance: '/__test/native-error',
      requestId: expect.any(String),
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      type: 'urn:syncpad:error:internal-error',
    });
  });

  it('preserves incoming request ids on responses', async () => {
    const app = createTestApp();
    const response = await app.request('/missing-route', {
      headers: {
        'x-request-id': 'req_from_client',
      },
    });
    const body = (await response.json()) as { requestId: string };

    expect(response.headers.get('x-request-id')).toBe('req_from_client');
    expect(body.requestId).toBe('req_from_client');
  });
});
