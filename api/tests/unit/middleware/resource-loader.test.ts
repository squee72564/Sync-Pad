import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createErrorHandler } from '../../../src/http/error-handler.js';
import type { AppVariables } from '../../../src/lib/context.js';
import {
  createDocumentResourceLoader,
  createOrganizationResourceLoader,
} from '../../../src/middleware/resource-loader.js';
import { documentRecord, organizationRecord } from '../../helpers/fixtures.js';
import { createTestDeps, testEnvFixture } from '../../helpers/test-deps.js';

const errorHandler = createErrorHandler(testEnvFixture);

afterEach(() => {
  vi.clearAllMocks();
});

describe('resource loader middleware', () => {
  it('loads an organization into context with a typed selector', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.organizationService.findById).mockResolvedValue(
      organizationRecord,
    );
    const { loadOrganizationResource } = createOrganizationResourceLoader({
      organizationService: deps.organizationService,
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
    const { loadOrganizationResource } = createOrganizationResourceLoader({
      organizationService: deps.organizationService,
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
    const { loadOrganizationResource } = createOrganizationResourceLoader({
      organizationService: deps.organizationService,
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

  it('loads a document in a workspace into context', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.documentService.findInWorkspace).mockResolvedValue(
      documentRecord,
    );
    const { loadDocumentResourceInWorkspace } = createDocumentResourceLoader({
      documentService: deps.documentService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('validated', {
        params: {
          workspaceId: 'ws_1',
          documentId: 'doc_1',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadDocumentResourceInWorkspace<{
        workspaceId: string;
        documentId: string;
      }>(({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      })),
      (context) => context.json({ document: context.get('document') }),
    );

    const response = await app.request('/protected');

    expect(deps.documentService.findInWorkspace).toHaveBeenCalledWith({
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      includeDeleted: undefined,
    });
    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      document: {
        id: 'doc_1',
        workspaceId: 'ws_1',
        title: 'Planning',
        color: '#336699FF',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    });
  });

  it('returns 404 when a document is missing from a workspace', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.documentService.findInWorkspace).mockResolvedValue(
      undefined,
    );
    const { loadDocumentResourceInWorkspace } = createDocumentResourceLoader({
      documentService: deps.documentService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      context.set('validated', {
        params: {
          workspaceId: 'ws_1',
          documentId: 'doc_missing',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadDocumentResourceInWorkspace<{
        workspaceId: string;
        documentId: string;
      }>(({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      })),
      () => new Response(null),
    );
    app.onError(errorHandler);

    const response = await app.request('/protected');

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'DOCUMENT_NOT_FOUND',
      detail: 'Document not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('passes includeDeleted when loading a document for hard delete', async () => {
    const deps = createTestDeps();
    vi.mocked(deps.documentService.findInWorkspace).mockResolvedValue({
      ...documentRecord,
      deletedAt: new Date('2024-01-04T03:04:05.000Z'),
    });
    const { loadDocumentResourceInWorkspace } = createDocumentResourceLoader({
      documentService: deps.documentService,
    });

    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('validated', {
        params: {
          workspaceId: 'ws_1',
          documentId: 'doc_1',
        },
      });
      await next();
    });
    app.get(
      '/protected',
      loadDocumentResourceInWorkspace<{
        workspaceId: string;
        documentId: string;
      }>(
        ({ params }) => ({
          workspaceId: params.workspaceId,
          documentId: params.documentId,
        }),
        { includeDeleted: true },
      ),
      () => new Response(null),
    );

    const response = await app.request('/protected');

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.documentService.findInWorkspace).toHaveBeenCalledWith({
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      includeDeleted: true,
    });
  });
});
