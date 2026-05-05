import { CoreError } from '@syncpad/errors';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../src/lib/error.js';
import {
  authenticatedSession,
  documentRecord,
  organizationRecord,
  workspaceRecord,
} from '../helpers/fixtures.js';
import {
  createTestApp,
  createTestAuth,
  createTestDeps,
} from '../helpers/test-deps.js';

afterEach(() => {
  vi.clearAllMocks();
});

const route = '/api/organizations/org_1/workspaces/ws_1/documents';

const createDocumentRouteDeps = () => {
  const deps = createTestDeps({
    auth: createTestAuth(authenticatedSession),
  });
  vi.mocked(deps.organizationService.findById).mockResolvedValue(
    organizationRecord,
  );
  vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(
    workspaceRecord,
  );
  vi.mocked(deps.documentService.findInWorkspace).mockResolvedValue(
    documentRecord,
  );
  vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(true);
  return deps;
};

describe('document routes', () => {
  it('returns 401 for nested document routes when unauthenticated', async () => {
    const response = await createTestApp({
      auth: createTestAuth(null),
    }).request(`${route}/doc_1`);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('returns 404 when the workspace is not in the organization', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.workspaceService.findInOrganization).mockResolvedValue(null);

    const response = await createTestApp(deps).request(`${route}/doc_1`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
      detail: 'Workspace not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('returns 404 when the document is not in the workspace', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.findInWorkspace).mockResolvedValue(
      undefined,
    );

    const response = await createTestApp(deps).request(`${route}/doc_1`);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      code: 'DOCUMENT_NOT_FOUND',
      detail: 'Document not found.',
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('returns 403 when document read permission is denied', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(false);

    const response = await createTestApp(deps).request(`${route}/doc_1`);

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(deps.permissionChecker.checkPermission).toHaveBeenCalledWith(
      { type: 'user', id: 'user_1', relation: '' },
      { type: 'document', documentId: 'doc_1' },
      'read',
    );
  });

  it('returns 403 when document manage permission is denied', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.permissionChecker.checkPermission).mockResolvedValue(false);

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(deps.permissionChecker.checkPermission).toHaveBeenCalledWith(
      { type: 'user', id: 'user_1', relation: '' },
      { type: 'document', documentId: 'doc_1' },
      'manage',
    );
  });

  it('returns documents for a workspace', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(
      deps.documentService.listByWorkspaceReadableToUser,
    ).mockResolvedValue([documentRecord]);

    const response = await createTestApp(deps).request(route);

    expect(response.status).toBe(StatusCodes.OK);
    expect(
      deps.documentService.listByWorkspaceReadableToUser,
    ).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      workspaceId: 'ws_1',
    });
    expect(await response.json()).toMatchObject({
      documents: [
        {
          id: 'doc_1',
          workspaceId: 'ws_1',
          title: 'Planning',
          color: '#336699FF',
          deletedAt: null,
        },
      ],
    });
  });

  it('validates create document input and returns 201', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.createDocument).mockResolvedValue(
      documentRecord,
    );

    const invalidResponse = await createTestApp(deps).request(route, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '', color: 'blue' }),
    });

    expect(invalidResponse.status).toBe(StatusCodes.BAD_REQUEST);

    const response = await createTestApp(deps).request(route, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Planning', color: '#336699FF' }),
    });

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(deps.documentService.createDocument).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      workspaceId: 'ws_1',
      input: {
        title: 'Planning',
        color: '#336699FF',
      },
    });
    expect(await response.json()).toMatchObject({
      document: {
        id: 'doc_1',
        title: 'Planning',
        color: '#336699FF',
      },
    });
  });

  it('rejects empty patch bodies with 400', async () => {
    const deps = createDocumentRouteDeps();

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(deps.documentService.updateDocument).not.toHaveBeenCalled();
  });

  it('updates a document and returns it', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.updateDocument).mockResolvedValue({
      ...documentRecord,
      title: 'Updated',
    });

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.documentService.updateDocument).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      documentId: 'doc_1',
      data: { title: 'Updated' },
    });
    expect(await response.json()).toMatchObject({
      document: {
        id: 'doc_1',
        title: 'Updated',
      },
    });
  });

  it('soft deletes a document', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.softDeleteDocument).mockResolvedValue({
      ...documentRecord,
      deletedAt: new Date('2024-01-04T03:04:05.000Z'),
    });

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.documentService.softDeleteDocument).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      documentId: 'doc_1',
    });
  });

  it('permanently deletes a document after loading deleted documents', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.deleteDocument).mockResolvedValue(
      documentRecord,
    );

    const response = await createTestApp(deps).request(
      `${route}/doc_1/permanent`,
      {
        method: 'DELETE',
      },
    );

    expect(response.status).toBe(StatusCodes.OK);
    expect(deps.documentService.findInWorkspace).toHaveBeenCalledWith({
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      includeDeleted: true,
    });
    expect(deps.documentService.deleteDocument).toHaveBeenCalledWith({
      actorUserId: 'user_1',
      documentId: 'doc_1',
    });
  });

  it('returns 500 INTERNAL_ERROR when document loading throws a native error', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.findInWorkspace).mockRejectedValue(
      new Error('pg failure'),
    );

    const response = await createTestApp(deps).request(`${route}/doc_1`);

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toMatchObject({
      code: 'INTERNAL_ERROR',
      detail: 'pg failure',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('preserves ApiError status thrown by document service', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.updateDocument).mockRejectedValue(
      new ApiError({
        code: 'DOCUMENT_CONFLICT',
        expose: true,
        message: 'conflict',
        status: StatusCodes.CONFLICT,
        userMessage: 'Document conflict.',
      }),
    );

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(await response.json()).toMatchObject({
      code: 'DOCUMENT_CONFLICT',
      detail: 'Document conflict.',
      status: StatusCodes.CONFLICT,
    });
  });

  it('preserves CoreError status thrown by document service', async () => {
    const deps = createDocumentRouteDeps();
    vi.mocked(deps.documentService.softDeleteDocument).mockRejectedValue(
      new CoreError({
        code: 'DOCUMENT_PERMISSION_DENIED',
        expose: true,
        kind: 'forbidden',
        message: 'denied',
        userMessage: 'You do not have access to this document.',
      }),
    );

    const response = await createTestApp(deps).request(`${route}/doc_1`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(await response.json()).toMatchObject({
      code: 'DOCUMENT_PERMISSION_DENIED',
      detail: 'You do not have access to this document.',
      status: StatusCodes.FORBIDDEN,
    });
  });
});
