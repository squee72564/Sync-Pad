import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../src/lib/error.js';
import {
  authenticatedSession,
  organizationRecord,
  workspaceRecord,
} from '../helpers/fixtures.js';
import {
  createTestApp,
  createTestAuth,
  createTestDeps,
} from '../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('workspace routes', () => {
  it('returns 401 for nested workspace routes when unauthenticated', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request('/api/organizations/org_1/workspaces/ws_1');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('returns workspace access when creating a workspace', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.workspaceService.createWorkspace).mockResolvedValue(
      workspaceRecord,
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Docs',
          description: 'Desc',
          color: '#80808080',
        }),
      },
    );

    expect(response.status).toBe(StatusCodes.CREATED);
    await expect(response.json()).resolves.toMatchObject({
      access: {
        permissions: {
          read: true,
          manage: true,
          invite: true,
          write: true,
          comment: true,
          run_ai: true,
        },
      },
      workspace: {
        id: workspaceRecord.id,
      },
    });
    expect(deps.workspaceService.getWorkspaceAccess).toHaveBeenCalledWith({
      actorUserId: authenticatedSession.user.id,
      workspaceId: workspaceRecord.id,
      permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
    });
  });

  it('returns canonical 503 when workspace creation sync fails', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.workspaceService.createWorkspace).mockRejectedValue(
      new ApiError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Docs',
          description: 'Desc',
          color: '#80808080',
        }),
      },
    );

    expect(response.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(await response.json()).toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      detail: 'Authorization updates could not be completed.',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('returns canonical 503 when adding a workspace member fails during sync', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(
      workspaceRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.workspaceService.addMember).mockRejectedValue(
      new ApiError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces/ws_1/members',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_2',
          workspaceRole: 'editor',
        }),
      },
    );

    expect(response.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(await response.json()).toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      detail: 'Authorization updates could not be completed.',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('returns 404 when updating a missing workspace membership', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(
      workspaceRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.workspaceService.updateMember).mockRejectedValue(
      new ApiError({
        code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
        expose: true,
        message: 'missing membership',
        status: StatusCodes.NOT_FOUND,
        userMessage: 'Workspace membership not found.',
      }),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces/ws_1/members/user_2',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          workspaceRole: 'editor',
        }),
      },
    );

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
      detail: 'Workspace membership not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('returns 500 INTERNAL_ERROR when workspace deletion throws a native error', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(
      workspaceRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.workspaceService.deleteWorkspace).mockRejectedValue(
      new Error('pg failure'),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces/ws_1',
      {
        method: 'DELETE',
      },
    );

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('returns 500 INTERNAL_ERROR when workspace loading throws a native error', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.workspaceService.findInOrganization).mockRejectedValue(
      new Error('pg failure'),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces/ws_1',
    );

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('returns 404 when a workspace does not belong to the route organization', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(null);

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1/workspaces/ws_1',
    );

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
      detail: 'Workspace not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });
});
