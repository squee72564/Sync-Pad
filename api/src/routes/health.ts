import type { DbPool } from '@syncpad/types';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';

import { checkDatabaseReadiness } from '../db/client.js';

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
