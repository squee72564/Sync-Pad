import type { DbPool } from '@syncpad/types';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../lib/error.js';

const checkDatabaseReadiness = async (pool: DbPool) => {
  try {
    await pool.query('select 1');
    return true;
  } catch (error) {
    throw new ApiError({
      cause: error,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database readiness check failed',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Database is unavailable.',
    });
  }
};

const createHealthPayload = (checks: Record<string, string>, ok: boolean) => ({
  checks,
  ok,
  timestamp: new Date().toISOString(),
});

export function createHealthRoute({ pool }: { pool: DbPool }) {
  return new Hono()
    .get('/health', (context) =>
      context.json(
        createHealthPayload(
          {
            process: 'ok',
          },
          true,
        ),
      ),
    )
    .get('/live', (context) =>
      context.json(
        createHealthPayload(
          {
            process: 'ok',
          },
          true,
        ),
      ),
    )
    .get('/ready', async (context) => {
      try {
        await checkDatabaseReadiness(pool);

        return context.json(
          createHealthPayload(
            {
              database: 'ok',
            },
            true,
          ),
        );
      } catch {
        return context.json(
          createHealthPayload(
            {
              database: 'unavailable',
            },
            false,
          ),
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }
    });
}
