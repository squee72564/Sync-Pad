import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../src/lib/error.js';
import type { AuthSession } from '../../src/types/auth.js';

vi.mock('../../src/lib/auth-session.js', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('../../src/authz/permify-client.js', () => ({
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('organization routes', () => {
  it('returns 401 for unauthenticated protected routes', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations/org_1');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns 400 for invalid organization create request bodies', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('returns 403 for authenticated but unauthorized organization access', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { permissionChecker } = await import(
      '../../src/authz/permify-client.js'
    );
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(false);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations/org_1');

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(await response.json()).toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns 200 for authorized organization detail requests', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { permissionChecker } = await import(
      '../../src/authz/permify-client.js'
    );
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(true);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations/org_1');

    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      organization: {
        ...organizationRecord,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns canonical 503 when organization creation sync fails', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { organizationService } = await import(
      '../../src/services/organization-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationService.createOrganization).mockRejectedValue(
      new AppError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Acme' }),
    });

    expect(response.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
    expect(await response.json()).toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      detail: 'Authorization updates could not be completed.',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('returns canonical 503 when adding an organization member fails during sync', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { permissionChecker } = await import(
      '../../src/authz/permify-client.js'
    );
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    const { organizationService } = await import(
      '../../src/services/organization-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(organizationService.addMember).mockRejectedValue(
      new AppError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request(
      '/api/organizations/org_1/members',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_2',
          organizationRole: 'member',
          status: 'active',
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

  it('returns 404 when updating a missing organization membership', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { permissionChecker } = await import(
      '../../src/authz/permify-client.js'
    );
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    const { organizationService } = await import(
      '../../src/services/organization-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(organizationService.updateMember).mockRejectedValue(
      new AppError({
        code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
        expose: true,
        message: 'missing membership',
        status: StatusCodes.NOT_FOUND,
        userMessage: 'Organization membership not found.',
      }),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request(
      '/api/organizations/org_1/members/user_2',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          organizationRole: 'admin',
        }),
      },
    );

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
      detail: 'Organization membership not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('returns 500 INTERNAL_ERROR when organization loading throws a native error', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { organizationRepository } = await import(
      '../../src/repositories/organization-repository.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationRepository.findById).mockRejectedValue(
      new Error('pg failure'),
    );
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/organizations/org_1');

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
