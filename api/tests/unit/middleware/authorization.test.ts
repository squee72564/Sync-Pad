import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppVariables } from '../../../src/lib/context.js';
import type { AuthUser } from '../../../src/types/auth.js';

vi.mock('../../../src/authz/permify-client.js', () => ({
  accessGraphSync: {
    apply: vi.fn(),
  },
  permissionChecker: {
    checkPermission: vi.fn(),
    deleteTuples: vi.fn(),
    writeTuples: vi.fn(),
  },
  permifyInstance: {},
}));

vi.mock('@syncpad/permify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@syncpad/permify')>();

  return {
    ...actual,
    subjects: {
      user: (userId: string) => ({
        type: 'user',
        id: userId,
        relation: '',
      }),
    },
  };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

const currentUser: AuthUser = {
  id: 'user_1',
  email: 'user@example.com',
  emailVerified: true,
  name: 'User One',
  image: null,
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-02T03:04:05.000Z'),
};

describe('authorization middleware', () => {
  it('returns 403 when organization permission is denied', async () => {
    const { requireOrganizationPermission } = await import(
      '../../../src/middleware/authorization.js'
    );
    const { errorHandler } = await import('../../../src/http/error-handler.js');
    const { permissionChecker } = await import(
      '../../../src/authz/permify-client.js'
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(false);

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      context.set('currentUser', currentUser);
      context.set('validated', {
        params: {
          organizationId: 'org_1',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      requireOrganizationPermission('read'),
      () => new Response(null),
    );
    app.onError(errorHandler);

    const response = await app.request('/protected');
    const body = await response.json();

    expect(permissionChecker.checkPermission).toHaveBeenCalledWith(
      { type: 'user', id: currentUser.id, relation: '' },
      { type: 'organization', organizationId: 'org_1' },
      'read',
    );
    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(body).toMatchObject({
      code: 'FORBIDDEN',
      detail: 'You do not have permission to perform this action.',
      status: StatusCodes.FORBIDDEN,
    });
  });

  it('passes when workspace permission is allowed', async () => {
    const { requireWorkspacePermission } = await import(
      '../../../src/middleware/authorization.js'
    );
    const { permissionChecker } = await import(
      '../../../src/authz/permify-client.js'
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(true);

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('currentUser', currentUser);
      context.set('validated', {
        params: {
          workspaceId: 'ws_1',
        },
      });
      await next();
    });
    app.get('/protected', requireWorkspacePermission('read'), (context) =>
      context.json(context.get('authorization'), StatusCodes.OK),
    );

    const response = await app.request('/protected');

    expect(permissionChecker.checkPermission).toHaveBeenCalledWith(
      { type: 'user', id: currentUser.id, relation: '' },
      { type: 'workspace', workspaceId: 'ws_1' },
      'read',
    );
    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      checked: true,
      permission: 'read',
      resource: 'workspace:ws_1',
    });
  });
});
