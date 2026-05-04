import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorHandler } from '../../../src/http/error-handler.js';
import type { AppVariables } from '../../../src/lib/context.js';
import { createAuthenticationMiddleware } from '../../../src/middleware/authentication.js';
import { authenticatedSession } from '../../helpers/fixtures.js';
import { createTestAuth } from '../../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('auth middleware', () => {
  it('requireAuth sets session and current user context when a session is present', async () => {
    const { requireAuth } = createAuthenticationMiddleware({
      auth: createTestAuth(authenticatedSession),
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
        ...authenticatedSession.session,
        expiresAt: authenticatedSession.session.expiresAt.toISOString(),
        createdAt: authenticatedSession.session.createdAt.toISOString(),
        updatedAt: authenticatedSession.session.updatedAt.toISOString(),
      },
      currentUser: {
        ...authenticatedSession.user,
        createdAt: authenticatedSession.user.createdAt.toISOString(),
        updatedAt: authenticatedSession.user.updatedAt.toISOString(),
      },
    });
  });

  it('requireAuth returns a 401 ApiError when the session is missing', async () => {
    const { requireAuth } = createAuthenticationMiddleware({
      auth: createTestAuth(null),
    });

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
