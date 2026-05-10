import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticatedSession,
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
});
