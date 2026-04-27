import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AppError } from '../../src/lib/error.js';

describe('app error handling', () => {
  it('returns canonical not found responses', async () => {
    const app = createApp();
    const response = await app.request('/missing-route');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(body).toEqual({
      code: 'ROUTE_NOT_FOUND',
      detail: 'The requested resource was not found.',
      instance: '/missing-route',
      status: StatusCodes.NOT_FOUND,
      title: 'Not Found',
      type: 'urn:syncpad:error:route-not-found',
    });
  });

  it('normalizes thrown AppError instances', async () => {
    const app = createApp();
    app.get('/__test/app-error', () => {
      throw new AppError({
        code: 'TEST_ERROR',
        expose: true,
        message: 'app error route failed',
        status: StatusCodes.IM_A_TEAPOT,
        userMessage: 'Intentional test failure.',
      });
    });

    const response = await app.request('/__test/app-error');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.IM_A_TEAPOT);
    expect(body).toEqual({
      code: 'TEST_ERROR',
      detail: 'Intentional test failure.',
      instance: '/__test/app-error',
      status: StatusCodes.IM_A_TEAPOT,
      title: "I'm a teapot",
      type: 'urn:syncpad:error:test-error',
    });
  });

  it('normalizes native thrown errors into internal errors', async () => {
    const app = createApp();
    app.get('/__test/native-error', () => {
      throw new Error('boom');
    });

    const response = await app.request('/__test/native-error');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({
      code: 'INTERNAL_ERROR',
      detail: 'boom',
      instance: '/__test/native-error',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      type: 'urn:syncpad:error:internal-error',
    });
  });
});
