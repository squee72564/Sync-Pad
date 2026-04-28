import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../src/lib/error.js';
import type { AuthSession } from '../../src/types/api.js';

vi.mock('../../src/lib/auth-session.js', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('../../src/authz/permify-client.js', async () => {
  const actual = await vi.importActual('../../src/authz/permify-client.js');
  return {
    ...actual,
    checkPermission: vi.fn(),
  };
});

vi.mock('../../src/repositories/organization-repository.js', () => ({
  organizationRepository: {
    findById: vi.fn(),
    listMemberships: vi.fn(),
    listOrganizationsForUser: vi.fn(),
  },
}));

vi.mock('../../src/repositories/workspace-repository.js', () => ({
  workspaceRepository: {
    findById: vi.fn(),
    listMemberships: vi.fn(),
    listByOrganizationReadableToUser: vi.fn(),
  },
}));

vi.mock('../../src/services/organization-service.js', () => ({
  organizationService: {
    listOrganizationsForUser: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
  },
}));

vi.mock('../../src/services/workspace-service.js', () => ({
  workspaceService: {
    listByOrganizationReadableToUser: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
  },
}));

const authenticatedSession: AuthSession = {
  session: {
    id: 'sess_1',
    userId: 'user_1',
    token: 'token_1',
    createdAt: new Date('2024-01-02T03:04:05.000Z'),
    updatedAt: new Date('2024-01-02T03:04:05.000Z'),
    expiresAt: new Date('2024-01-02T03:04:05.000Z'),
  },
  user: {
    id: 'user_1',
    email: 'user@example.com',
    emailVerified: true,
    name: 'User One',
    image: null,
    createdAt: new Date('2024-01-02T03:04:05.000Z'),
    updatedAt: new Date('2024-01-02T03:04:05.000Z'),
  },
};

const organizationRecord = {
  id: 'org_1',
  name: 'Acme',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-02T03:04:05.000Z'),
};

const workspaceRecord = {
  id: 'ws_1',
  organizationId: 'org_1',
  name: 'Docs',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-02T03:04:05.000Z'),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('workspace routes', () => {
  it('returns 401 for direct workspace routes when unauthenticated', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/workspaces/ws_1');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('returns canonical 503 when workspace creation sync fails', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { checkPermission } = await import(
      '../../src/authz/permify-client.js'
    );
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    const { workspaceService } = await import(
      '../../src/services/workspace-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(checkPermission).mockResolvedValue(true);
    vi.mocked(workspaceService.createWorkspace).mockRejectedValue(
      new AppError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request(
      '/api/organizations/org_1/workspaces',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Docs' }),
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
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { checkPermission } = await import(
      '../../src/authz/permify-client.js'
    );
    const { workspaceRepository } = await import(
      '../../src/repositories/workspace-repository.js'
    );
    const { workspaceService } = await import(
      '../../src/services/workspace-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(workspaceRepository.findById).mockResolvedValue(workspaceRecord);
    vi.mocked(checkPermission).mockResolvedValue(true);
    vi.mocked(workspaceService.addMember).mockRejectedValue(
      new AppError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/workspaces/ws_1/members', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user_2',
        workspaceRole: 'editor',
      }),
    });

    expect(response.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(await response.json()).toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      detail: 'Authorization updates could not be completed.',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('returns 404 when updating a missing workspace membership', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { checkPermission } = await import(
      '../../src/authz/permify-client.js'
    );
    const { workspaceRepository } = await import(
      '../../src/repositories/workspace-repository.js'
    );
    const { workspaceService } = await import(
      '../../src/services/workspace-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(workspaceRepository.findById).mockResolvedValue(workspaceRecord);
    vi.mocked(checkPermission).mockResolvedValue(true);
    vi.mocked(workspaceService.updateMember).mockRejectedValue(
      new AppError({
        code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
        expose: true,
        message: 'missing membership',
        status: StatusCodes.NOT_FOUND,
        userMessage: 'Workspace membership not found.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request(
      '/api/workspaces/ws_1/members/user_2',
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
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { checkPermission } = await import(
      '../../src/authz/permify-client.js'
    );
    const { workspaceRepository } = await import(
      '../../src/repositories/workspace-repository.js'
    );
    const { workspaceService } = await import(
      '../../src/services/workspace-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(workspaceRepository.findById).mockResolvedValue(workspaceRecord);
    vi.mocked(checkPermission).mockResolvedValue(true);
    vi.mocked(workspaceService.deleteWorkspace).mockRejectedValue(
      new Error('pg failure'),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/workspaces/ws_1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('returns 500 INTERNAL_ERROR when workspace loading throws a native error', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { workspaceRepository } = await import(
      '../../src/repositories/workspace-repository.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(workspaceRepository.findById).mockRejectedValue(
      new Error('pg failure'),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/workspaces/ws_1');

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
