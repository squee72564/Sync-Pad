import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from '../../src/types/auth.js';

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

const workspaceSummary = {
  id: 'ws_1',
  name: 'Docs',
  organizationId: 'org_1',
  organizationName: 'Acme',
  workspaceRole: 'editor' as const,
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-03T03:04:05.000Z'),
};

const organizationRecord = {
  id: 'org_1',
  name: 'Acme',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-03T03:04:05.000Z'),
};

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
