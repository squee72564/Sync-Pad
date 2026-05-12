import { authSchema, type DbClient } from '@syncpad/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export type SyncpadAuthConfig = {
  baseUrl: string;
  nodeEnv: 'development' | 'test' | 'production';
  secret: string;
};

export function createSyncpadAuth({
  config,
  db,
}: {
  config: SyncpadAuthConfig;
  db: DbClient;
}) {
  const appOrigin = new URL(config.baseUrl).origin;

  return betterAuth({
    secret: config.secret,
    baseURL: config.baseUrl,
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
    rateLimit: {
      customRules: {
        '/get-session': {
          window: 10,
          max: 1_000,
        },
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      },
      useSecureCookies: config.nodeEnv === 'production',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    },
  });
}

export type SyncpadAuth = ReturnType<typeof createSyncpadAuth>;
