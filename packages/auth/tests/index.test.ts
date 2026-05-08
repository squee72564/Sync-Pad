import { authSchema } from '@syncpad/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSyncpadAuth } from '../src/index.js';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((config) => ({ config })),
  drizzleAdapter: vi.fn((db, options) => ({ db, options })),
}));

vi.mock('better-auth', () => ({
  betterAuth: mocks.betterAuth,
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: mocks.drizzleAdapter,
}));

describe('createSyncpadAuth', () => {
  beforeEach(() => {
    mocks.betterAuth.mockClear();
    mocks.drizzleAdapter.mockClear();
  });

  it('configures Better Auth with shared Sync Pad defaults', () => {
    const db = { query: {} };

    const auth = createSyncpadAuth({
      db: db as never,
      config: {
        baseUrl: 'http://localhost:3000/api/auth',
        nodeEnv: 'development',
        secret: 'x'.repeat(32),
      },
    });

    expect(auth).toEqual({ config: mocks.betterAuth.mock.calls[0]?.[0] });
    expect(mocks.drizzleAdapter).toHaveBeenCalledWith(db, {
      provider: 'pg',
      schema: authSchema,
    });
    expect(mocks.betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: '/api/auth',
        baseURL: 'http://localhost:3000/api/auth',
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
        },
        secret: 'x'.repeat(32),
        trustedOrigins: ['http://localhost:3000'],
      }),
    );
    expect(mocks.betterAuth.mock.calls[0]?.[0].advanced).toEqual({
      useSecureCookies: false,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    });
  });

  it('uses secure cookies in production', () => {
    createSyncpadAuth({
      db: {} as never,
      config: {
        baseUrl: 'https://syncpad.example.com/api/auth',
        nodeEnv: 'production',
        secret: 'x'.repeat(32),
      },
    });

    expect(mocks.betterAuth.mock.calls[0]?.[0].advanced.useSecureCookies).toBe(
      true,
    );
  });
});
