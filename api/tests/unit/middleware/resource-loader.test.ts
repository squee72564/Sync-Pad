import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppVariables } from '../../../src/lib/context.js';

vi.mock('../../../src/repositories/organization-repository.js', () => ({
  organizationRepository: {
    findById: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('resource loader middleware', () => {
  it('loads an organization into context with a typed selector', async () => {
    const { loadOrganization } = await import(
      '../../../src/middleware/resource-loader.js'
    );
    const { organizationRepository } = await import(
      '../../../src/repositories/organization-repository.js'
    );
    vi.mocked(organizationRepository.findById).mockResolvedValue({
      id: 'org_1',
      name: 'Acme',
      createdAt: new Date(),
      updatedAt: new Date(),
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
      loadOrganization<{ organizationId: string }>(
        ({ params }) => params.organizationId,
      ),
      (context) => context.json({ organization: context.get('organization') }),
    );

    const response = await app.request('/protected');

    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      organization: {
        id: 'org_1',
        name: 'Acme',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('returns 404 when an organization is missing', async () => {
    const { loadOrganization } = await import(
      '../../../src/middleware/resource-loader.js'
    );
    const { errorHandler } = await import('../../../src/http/error-handler.js');
    const { organizationRepository } = await import(
      '../../../src/repositories/organization-repository.js'
    );
    vi.mocked(organizationRepository.findById).mockResolvedValue(undefined);

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
      loadOrganization<{ organizationId: string }>(
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
    const { loadOrganization } = await import(
      '../../../src/middleware/resource-loader.js'
    );
    const { errorHandler } = await import('../../../src/http/error-handler.js');

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
      loadOrganization<{ organizationId: string }>(
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
