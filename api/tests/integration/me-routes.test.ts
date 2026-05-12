import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticatedSession,
  organizationInviteRecord,
  organizationRecord,
  workspaceSummary,
} from '../helpers/fixtures.js';
import {
  createTestApp,
  createTestAuth,
  createTestDeps,
} from '../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('me routes', () => {
  it('returns 401 for unauthenticated workspace list requests', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request('/api/me/workspaces');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns workspaces readable to the authenticated user', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.workspaceService.listReadableToUserPage).mockResolvedValue({
      workspaces: [workspaceSummary],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request('/api/me/workspaces');

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.workspaceService.listReadableToUserPage).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      q: undefined,
      pagination: {
        limit: 24,
        cursor: undefined,
      },
    });
    expect(await response.json()).toEqual({
      workspaces: [
        {
          ...workspaceSummary,
          createdAt: workspaceSummary.createdAt.toISOString(),
          updatedAt: workspaceSummary.updatedAt.toISOString(),
        },
      ],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('passes workspace search and pagination query params to the service', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.workspaceService.listReadableToUserPage).mockResolvedValue({
      workspaces: [],
      pageInfo: {
        limit: 10,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request(
      '/api/me/workspaces?q=design&limit=10&cursor=abc',
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.workspaceService.listReadableToUserPage).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      q: 'design',
      pagination: {
        limit: 10,
        cursor: 'abc',
      },
    });
  });

  it('returns 401 for unauthenticated organization list requests', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request('/api/me/organizations');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns organizations for the authenticated user', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(
      deps.organizationService.listOrganizationsForUserPage,
    ).mockResolvedValue({
      organizations: [organizationRecord],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request('/api/me/organizations');

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.listOrganizationsForUserPage,
    ).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      q: undefined,
      pagination: {
        limit: 24,
        cursor: undefined,
      },
    });
    expect(await response.json()).toEqual({
      organizations: [
        {
          ...organizationRecord,
          createdAt: organizationRecord.createdAt.toISOString(),
          updatedAt: organizationRecord.updatedAt.toISOString(),
        },
      ],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('passes organization search and pagination query params to the service', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(
      deps.organizationService.listOrganizationsForUserPage,
    ).mockResolvedValue({
      organizations: [],
      pageInfo: {
        limit: 10,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request(
      '/api/me/organizations?q=acme&limit=10&cursor=abc',
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.listOrganizationsForUserPage,
    ).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      q: 'acme',
      pagination: {
        limit: 10,
        cursor: 'abc',
      },
    });
  });

  it('returns 401 for unauthenticated invitation list requests', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request('/api/me/invitations');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns organization invitations for the authenticated user email', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(
      deps.organizationService.listOrganizationInvitesForUserPage,
    ).mockResolvedValue({
      organizationInvites: [
        {
          ...organizationInviteRecord,
          organizationName: 'Acme',
          invitedByEmail: 'admin@example.com',
        },
      ],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request('/api/me/invitations');

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.listOrganizationInvitesForUserPage,
    ).toHaveBeenCalledWith({
      userEmail: 'user@example.com',
      q: undefined,
      status: undefined,
      pagination: {
        limit: 24,
        cursor: undefined,
      },
    });
    const responseJson = (await response.json()) as {
      organizationInvites: Record<string, unknown>[];
    };
    expect(responseJson.organizationInvites[0]).not.toHaveProperty('tokenHash');
    expect(responseJson).toEqual({
      organizationInvites: [
        {
          id: organizationInviteRecord.id,
          organizationId: organizationInviteRecord.organizationId,
          email: organizationInviteRecord.email,
          organizationRole: organizationInviteRecord.organizationRole,
          status: organizationInviteRecord.status,
          invitedBy: organizationInviteRecord.invitedBy,
          acceptedBy: organizationInviteRecord.acceptedBy,
          expiresAt: organizationInviteRecord.expiresAt.toISOString(),
          acceptedAt: organizationInviteRecord.acceptedAt,
          declinedAt: organizationInviteRecord.declinedAt,
          revokedAt: organizationInviteRecord.revokedAt,
          lastSentAt: organizationInviteRecord.lastSentAt.toISOString(),
          createdAt: organizationInviteRecord.createdAt.toISOString(),
          updatedAt: organizationInviteRecord.updatedAt.toISOString(),
          organizationName: 'Acme',
          invitedByEmail: 'admin@example.com',
          isExpired: true,
        },
      ],
      pageInfo: {
        limit: 24,
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('passes invitation search, status, and pagination query params to the service', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(
      deps.organizationService.listOrganizationInvitesForUserPage,
    ).mockResolvedValue({
      organizationInvites: [],
      pageInfo: {
        limit: 10,
        nextCursor: null,
        hasNextPage: false,
      },
    });

    const response = await createTestApp(deps).request(
      '/api/me/invitations?q=acme&status=pending&limit=10&cursor=abc',
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.listOrganizationInvitesForUserPage,
    ).toHaveBeenCalledWith({
      userEmail: 'user@example.com',
      q: 'acme',
      status: 'pending',
      pagination: {
        limit: 10,
        cursor: 'abc',
      },
    });
  });

  it('creates an authenticated link for a pending invitation owned by the user', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(
      deps.organizationService.getOrganizationInvitationForUserById,
    ).mockResolvedValue({
      ...organizationInviteRecord,
      expiresAt: new Date('2999-02-02T03:04:05.000Z'),
    });
    vi.mocked(
      deps.organizationService.rotateOrganizationInvitationTokenForOpen,
    ).mockResolvedValue(organizationInviteRecord);

    const response = await createTestApp(deps).request(
      '/api/me/invitations/org_invite_1/link',
      { method: 'POST' },
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.getOrganizationInvitationForUserById,
    ).toHaveBeenCalledWith({
      organizationInviteId: 'org_invite_1',
      userEmail: 'user@example.com',
    });
    expect(
      deps.organizationService.rotateOrganizationInvitationTokenForOpen,
    ).toHaveBeenCalledWith({
      organizationInviteId: 'org_invite_1',
      organizationId: organizationRecord.id,
      tokenHash: expect.any(String),
      rotatedAt: expect.any(Date),
    });
    await expect(response.json()).resolves.toMatchObject({
      inviteUrl: expect.stringMatching(
        /^\/invitations\/org_1\/[A-Za-z0-9_-]+$/,
      ),
    });
  });
});
