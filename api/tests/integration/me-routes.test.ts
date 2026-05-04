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
    vi.mocked(deps.workspaceService.listReadableToUser).mockResolvedValue([
      workspaceSummary,
    ]);

    const response = await createTestApp(deps).request('/api/me/workspaces');

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.workspaceService.listReadableToUser).toHaveBeenCalledWith({
      actorUserId: 'user_1',
    });
    expect(await response.json()).toEqual({
      workspaces: [
        {
          ...workspaceSummary,
          createdAt: workspaceSummary.createdAt.toISOString(),
          updatedAt: workspaceSummary.updatedAt.toISOString(),
        },
      ],
    });
  });

  it('returns 400 for unsupported workspace list query params', async () => {
    const response = await createTestApp({
      auth: createTestAuth(authenticatedSession),
    }).request('/api/me/workspaces?limit=10');

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
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
      deps.organizationService.listOrganizationsForUser,
    ).mockResolvedValue([organizationRecord]);

    const response = await createTestApp(deps).request('/api/me/organizations');

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.organizationService.listOrganizationsForUser,
    ).toHaveBeenCalledWith('user_1');
    expect(await response.json()).toEqual({
      organizations: [
        {
          ...organizationRecord,
          createdAt: organizationRecord.createdAt.toISOString(),
          updatedAt: organizationRecord.updatedAt.toISOString(),
        },
      ],
    });
  });

  it('returns 400 for unsupported organization list query params', async () => {
    const response = await createTestApp({
      auth: createTestAuth(authenticatedSession),
    }).request('/api/me/organizations?limit=10');

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });
});
