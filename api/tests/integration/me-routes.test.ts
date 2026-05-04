import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticatedSession,
  organizationRecord,
  workspaceSummary,
} from '../helpers/fixtures.js';

vi.mock('../../src/lib/auth-session.js', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('../../src/services/workspace-service.js', () => ({
  workspaceService: {
    listReadableToUser: vi.fn(),
  },
}));

vi.mock('../../src/services/organization-service.js', () => ({
  organizationService: {
    listOrganizationsForUser: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('me routes', () => {
  it('returns 401 for unauthenticated workspace list requests', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/me/workspaces');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns workspaces readable to the authenticated user', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { workspaceService } = await import(
      '../../src/services/workspace-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(workspaceService.listReadableToUser).mockResolvedValue([
      workspaceSummary,
    ]);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/me/workspaces');

    expect(response.status).toBe(StatusCodes.OK);
    expect(workspaceService.listReadableToUser).toHaveBeenCalledWith({
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
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/me/workspaces?limit=10');

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('returns 401 for unauthenticated organization list requests', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/me/organizations');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns organizations for the authenticated user', async () => {
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    const { organizationService } = await import(
      '../../src/services/organization-service.js'
    );
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    vi.mocked(organizationService.listOrganizationsForUser).mockResolvedValue([
      organizationRecord,
    ]);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request('/api/me/organizations');

    expect(response.status).toBe(StatusCodes.OK);
    expect(organizationService.listOrganizationsForUser).toHaveBeenCalledWith(
      'user_1',
    );
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
    const { getAuthSession } = await import('../../src/lib/auth-session.js');
    vi.mocked(getAuthSession).mockResolvedValue(authenticatedSession);
    const { createApp } = await import('../../src/app.js');

    const response = await createApp().request(
      '/api/me/organizations?limit=10',
    );

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });
});
