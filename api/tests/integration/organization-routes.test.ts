import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../src/lib/error.js';
import {
  authenticatedSession,
  organizationRecord,
} from '../helpers/fixtures.js';
import {
  createTestApp,
  createTestAuth,
  createTestDeps,
} from '../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('organization routes', () => {
  it('returns 401 for unauthenticated protected routes', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request('/api/organizations/org_1');

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHENTICATED',
      detail: 'Authentication is required.',
    });
  });

  it('returns 400 for invalid organization create request bodies', async () => {
    const response = await createTestApp({
      auth: createTestAuth(authenticatedSession),
    }).request('/api/organizations', {
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
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(false);

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1',
    );

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(await response.json()).toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('returns 200 for authorized organization detail requests', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1',
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      organization: {
        ...organizationRecord,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      access: {
        permissions: {
          read: true,
          manage: true,
          invite: true,
          create_workspace: true,
          run_ai: true,
        },
      },
    });
  });

  it('returns 200 for authorized organization update requests', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.organizationService.updateOrganization).mockResolvedValue({
      ...organizationRecord,
      name: 'Acme Updated',
    });

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Acme Updated' }),
      },
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.organizationService.updateOrganization).toHaveBeenCalledWith({
      organizationId: 'org_1',
      input: { name: 'Acme Updated' },
    });
    expect(await response.json()).toEqual({
      organization: {
        ...organizationRecord,
        name: 'Acme Updated',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns 200 for authorized organization delete requests', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.organizationService.deleteOrganization).mockResolvedValue(
      organizationRecord,
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1',
      {
        method: 'DELETE',
      },
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.organizationService.deleteOrganization).toHaveBeenCalledWith(
      'org_1',
    );
    expect(await response.json()).toEqual({
      organization: {
        ...organizationRecord,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns canonical 503 when organization creation sync fails', async () => {
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.createOrganization).mockRejectedValue(
      new ApiError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );

    const response = await createTestApp(deps).request('/api/organizations', {
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
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.organizationService.addMember).mockRejectedValue(
      new ApiError({
        code: 'PERMIFY_SYNC_FAILED',
        message: 'sync failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization updates could not be completed.',
      }),
    );

    const response = await createTestApp(deps).request(
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
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
    vi.mocked(deps.organizationService.updateMember).mockRejectedValue(
      new ApiError({
        code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
        expose: true,
        message: 'missing membership',
        status: StatusCodes.NOT_FOUND,
        userMessage: 'Organization membership not found.',
      }),
    );

    const response = await createTestApp(deps).request(
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
    const deps = createTestDeps({
      auth: createTestAuth(authenticatedSession),
    });
    vi.mocked(deps.organizationService.findById).mockRejectedValue(
      new Error('pg failure'),
    );

    const response = await createTestApp(deps).request(
      '/api/organizations/org_1',
    );

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
