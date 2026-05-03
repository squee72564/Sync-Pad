import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './schema/auth-schema.js';
import * as coreSchema from './schema/core.js';

export function createDbClientAndPool(connectionString: string) {
  const pool = new Pool({
    connectionString,
  });
  const client = drizzle(pool, {
    schema: {
      ...authSchema,
      ...coreSchema,
    },
  });

  return {
    pool: pool,
    client,
  };
}

export type DbClient = ReturnType<typeof createDbClientAndPool>['client'];
export type DbPool = ReturnType<typeof createDbClientAndPool>['pool'];
