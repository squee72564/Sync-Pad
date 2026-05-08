import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuth } from '../src/lib/auth.js';

const mocks = vi.hoisted(() => ({
  createSyncpadAuth: vi.fn((input) => ({ input })),
}));

vi.mock('@syncpad/auth', () => ({
  createSyncpadAuth: mocks.createSyncpadAuth,
}));

describe('createAuth', () => {
  beforeEach(() => {
    mocks.createSyncpadAuth.mockClear();
  });

  it('adapts websocket env values for the shared auth package', () => {
    const db = {};

    const auth = createAuth({
      db: db as never,
      env: {
        BETTER_AUTH_SECRET: 'x'.repeat(32),
        BETTER_AUTH_URL: 'http://localhost:3000',
        NODE_ENV: 'test',
      } as never,
    });

    expect(auth).toEqual({ input: mocks.createSyncpadAuth.mock.calls[0]?.[0] });
    expect(mocks.createSyncpadAuth).toHaveBeenCalledWith({
      db,
      config: {
        baseUrl: 'http://localhost:3000',
        nodeEnv: 'test',
        secret: 'x'.repeat(32),
      },
    });
  });
});
