import { drizzle } from 'drizzle-orm/node-postgres';
import { StatusCodes } from 'http-status-codes';
import { Pool } from 'pg';

import { env } from '../lib/env.js';
import { AppError } from '../lib/error.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const checkDatabaseReadiness = async () => {
  try {
    await pool.query('select 1');
    return true;
  } catch (error) {
    throw new AppError({
      cause: error,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database readiness check failed',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Database is unavailable.',
    });
  }
};

export const db = drizzle(pool);
export { pool };
