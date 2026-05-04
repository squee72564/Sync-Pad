import type { DbPool } from '@syncpad/db';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../lib/error.js';

export const checkDatabaseReadiness = async (pool: DbPool) => {
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
