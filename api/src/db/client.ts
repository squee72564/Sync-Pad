import { createDbClientAndPool } from '@syncpad/db';
import { StatusCodes } from 'http-status-codes';
import { env } from '../lib/env.js';
import { ApiError } from '../lib/error.js';

export const { pool, client: db } = createDbClientAndPool(env.DATABASE_URL);

export const checkDatabaseReadiness = async () => {
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
