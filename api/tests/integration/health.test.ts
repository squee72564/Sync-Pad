import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

const query = vi.fn();

const createHealthApp = async () => {
  const { createHealthRoute } = await import('../../src/routes/health.js');
  return new Hono().route(
    '/',
    createHealthRoute({
      pool: {
        query,
      } as never,
    }),
  );
};

afterEach(() => {
  query.mockReset();
  vi.resetModules();
});

describe('health routes', () => {
  it('returns liveness from /health', async () => {
    const app = await createHealthApp();
    const response = await app.request('/health');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.OK);
    expect(body).toEqual({
      checks: {
        process: 'ok',
      },
      ok: true,
      timestamp: expect.any(String),
    });
  });

  it('returns liveness from /live', async () => {
    const app = await createHealthApp();
    const response = await app.request('/live');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.OK);
    expect(body).toEqual({
      checks: {
        process: 'ok',
      },
      ok: true,
      timestamp: expect.any(String),
    });
  });

  it('returns readiness success when the database is available', async () => {
    query.mockResolvedValue({} as never);

    const app = await createHealthApp();
    const response = await app.request('/ready');
    const body = await response.json();

    expect(query).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(StatusCodes.OK);
    expect(body).toEqual({
      checks: {
        database: 'ok',
      },
      ok: true,
      timestamp: expect.any(String),
    });
  });

  it('returns readiness failure when the database is unavailable', async () => {
    query.mockRejectedValue(new Error('db unavailable'));

    const app = await createHealthApp();
    const response = await app.request('/ready');
    const body = await response.json();

    expect(query).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(body).toEqual({
      checks: {
        database: 'unavailable',
      },
      ok: false,
      timestamp: expect.any(String),
    });
  });
});
