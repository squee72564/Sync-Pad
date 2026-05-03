import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppVariables } from '../../../src/lib/context.js';

vi.mock('../../../src/lib/auth-session.js', () => ({
  getAuthSession: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

const authMockObject = {
  session: {
    id: 'sess_1',
    userId: 'user_1',
    expiresAt: new Date(),
    createdAt: new Date(),
    token: 'example_token',
    ipAddress: null,
    userAgent: null,
    updatedAt: new Date(),
  },
  user: {
    id: 'user_1',
    email: 'user@example.com',
    name: 'Test User',
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
  },
};

describe('auth middleware', () => {
  it('requireAuth sets session and current user context when a session is present', async () => {
    const { requireAuth } = await import(
      '../../../src/middleware/authentication.js'
    );
    const { getAuthSession } = await import('../../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue({
      session: authMockObject.session,
      user: authMockObject.user,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.get('/protected', requireAuth(), (context) =>
      context.json(
        {
          session: context.get('session'),
          currentUser: context.get('currentUser'),
        },
        StatusCodes.OK,
      ),
    );

    const response = await app.request('/protected');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.OK);
    expect(body).toEqual({
      session: {
        ...authMockObject.session,
        expiresAt: authMockObject.session.expiresAt.toISOString(),
        createdAt: authMockObject.session.createdAt.toISOString(),
        updatedAt: authMockObject.session.updatedAt.toISOString(),
      },
      currentUser: {
        ...authMockObject.user,
        createdAt: authMockObject.user.createdAt.toISOString(),
        updatedAt: authMockObject.user.updatedAt.toISOString(),
      },
    });
  });

  it('requireAuth returns a 401 ApiError when the session is missing', async () => {
    const { requireAuth } = await import(
      '../../../src/middleware/authentication.js'
    );
    const { getAuthSession } = await import('../../../src/lib/auth-session.js');
    const { errorHandler } = await import('../../../src/http/error-handler.js');
    vi.mocked(getAuthSession).mockResolvedValue(null);

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      await next();
    });
    app.get('/protected', requireAuth(), () => new Response(null));
    app.onError(errorHandler);

    const response = await app.request('/protected');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(body).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
      status: StatusCodes.UNAUTHORIZED,
      title: 'Unauthorized',
    });
  });
});
