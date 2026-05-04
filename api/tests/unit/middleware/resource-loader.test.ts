import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorHandler } from '../../../src/http/error-handler.js';
import type { AppVariables } from '../../../src/lib/context.js';
import { createResourceLoader } from '../../../src/middleware/resource-loader.js';
import { organizationRecord } from '../../helpers/fixtures.js';
import { createTestDeps } from '../../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('resource loader middleware', () => {
  it('loads an organization into context with a typed selector', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    const { loadOrganizationResource } = createResourceLoader({
      organizationService: deps.organizationService,
      workspaceService: deps.workspaceService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('validated', {
        params: {
          organizationId: 'org_1',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadOrganizationResource<{ organizationId: string }>(
        ({ params }) => params.organizationId,
      ),
      (context) => context.json({ organization: context.get('organization') }),
    );

    const response = await app.request('/protected');

    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      organization: {
        description: 'example org desc',
        id: 'org_1',
        name: 'Acme',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns 404 when an organization is missing', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.organizationService.findById).mockResolvedValue(undefined);
    const { loadOrganizationResource } = createResourceLoader({
      organizationService: deps.organizationService,
      workspaceService: deps.workspaceService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      context.set('validated', {
        params: {
          organizationId: 'org_missing',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadOrganizationResource<{ organizationId: string }>(
        ({ params }) => params.organizationId,
      ),
      () => new Response(null),
    );
    app.onError(errorHandler);

    const response = await app.request('/protected');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(body).toMatchObject({
      code: 'ORGANIZATION_NOT_FOUND',
      detail: 'Organization not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('returns 404 when the validated organization id is empty', async () => {
    const deps = createTestDeps();
    const { loadOrganizationResource } = createResourceLoader({
      organizationService: deps.organizationService,
      workspaceService: deps.workspaceService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      context.set('validated', {
        params: {
          organizationId: '',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadOrganizationResource<{ organizationId: string }>(
        ({ params }) => params.organizationId,
      ),
      () => new Response(null),
    );
    app.onError(errorHandler);

    const response = await app.request('/protected');
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(body).toMatchObject({
      code: 'ORGANIZATION_NOT_FOUND',
      detail: 'Organization not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });
});
