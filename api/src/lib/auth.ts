import { authSchema, type DbClient } from '@syncpad/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Env } from './env.js';

export function createAuth({ db, env }: { db: DbClient; env: Env }) {
  const appOrigin = new URL(env.BETTER_AUTH_URL).origin;

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),
    trustedOrigins: [appOrigin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === 'production',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
