import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

const checkDatabaseReadiness = vi.fn();

vi.mock('../../src/db/client.js', () => ({
  checkDatabaseReadiness,
}));

const createHealthApp = async () => {
  const { healthRoute } = await import('../../src/routes/health.js');
  return new Hono().route('/', healthRoute);
};

afterEach(() => {
  checkDatabaseReadiness.mockReset();
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
    checkDatabaseReadiness.mockResolvedValue(true);

    const app = await createHealthApp();
    const response = await app.request('/ready');
    const body = await response.json();

    expect(checkDatabaseReadiness).toHaveBeenCalledTimes(1);
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
    checkDatabaseReadiness.mockRejectedValue(new Error('db unavailable'));

    const app = await createHealthApp();
    const response = await app.request('/ready');
    const body = await response.json();

    expect(checkDatabaseReadiness).toHaveBeenCalledTimes(1);
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
