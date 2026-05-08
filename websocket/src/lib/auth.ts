import { createSyncpadAuth } from '@syncpad/auth';
import type { DbClient } from '@syncpad/db';
import type { Env } from './env.js';

export function createAuth({ db, env }: { db: DbClient; env: Env }) {
  return createSyncpadAuth({
    db,
    config: {
      baseUrl: env.BETTER_AUTH_URL,
      nodeEnv: env.NODE_ENV,
      secret: env.BETTER_AUTH_SECRET,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
