import type {
  DocumentService,
  OrganizationService,
  WorkspaceService,
} from '@syncpad/core';
import type { PermissionChecker } from '@syncpad/permify';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  DOCUMENT_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { createAuthorizationMiddleware } from '../middleware/authorization.js';
import {
  createDocumentResourceLoader,
  createOrganizationWorkspaceResourceLoader,
} from '../middleware/resource-loader.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import {
  type CreateDocumentInput,
  createDocumentSchema,
  type OrganizationWorkspaceDocumentParams,
  type OrganizationWorkspaceDocumentQuery,
  organizationWorkspaceDocumentParamsSchema,
  organizationWorkspaceDocumentQuerySchema,
  type UpdateDocumentInput,
  updateDocumentSchema,
} from '../schemas/document.js';
import {
  type OrganizationWorkspaceParams,
  organizationWorkspaceParamsSchema,
} from '../schemas/workspace.js';

const getCurrentUser = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const user = context.get(CURRENT_USER_CONTEXT_KEY);

  if (!user) {
    throw new ApiError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Authenticated route is missing current user context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return user;
};

const getDocumentResource = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const document = context.get(DOCUMENT_CONTEXT_KEY);

  if (!document) {
    throw new ApiError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Document route is missing loaded document context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return document;
};

export function createOrganizationWorkspaceDocumentsRoute({
  organizationService,
  workspaceService,
  documentService,
  permissionChecker,
  auth,
}: {
  organizationService: OrganizationService;
  workspaceService: WorkspaceService;
  documentService: DocumentService;
  permissionChecker: PermissionChecker;
  auth: Auth;
}) {
  const organizationWorkspaceDocumentsRoute = new Hono<{
    Variables: AppVariables;
  }>();
  const { loadOrganizationResource, loadWorkspaceResourceInOrganization } =
    createOrganizationWorkspaceResourceLoader({
      organizationService,
      workspaceService,
    });
  const { loadDocumentResourceInWorkspace } = createDocumentResourceLoader({
    documentService,
  });
  const { requireWorkspacePermission, requireDocumentPermission } =
    createAuthorizationMiddleware({
      permissionChecker,
    });
  const { requireAuth } = createAuthenticationMiddleware({ auth });

  organizationWorkspaceDocumentsRoute.get(
    '/',
    requireAuth(),
    validateRequest({
      params: organizationWorkspaceParamsSchema,
      query: organizationWorkspaceDocumentQuerySchema,
    }),
    loadOrganizationResource<OrganizationWorkspaceParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    requireWorkspacePermission('read'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params, query } = getValidated<
        OrganizationWorkspaceParams,
        OrganizationWorkspaceDocumentQuery
      >(context);
      const { documents, pageInfo } =
        await documentService.listByWorkspaceReadableToUserPage({
          actorUserId: user.id,
          workspaceId: params.workspaceId,
          q: query.q,
          pagination: {
            limit: query.limit,
            cursor: query.cursor,
          },
        });

      const access = await workspaceService.getWorkspaceAccess({
        actorUserId: user.id,
        workspaceId: params.workspaceId,
        permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
      });

      return context.json({ documents, pageInfo, access }, StatusCodes.OK);
    },
  );

  organizationWorkspaceDocumentsRoute.post(
    '/',
    requireAuth(),
    validateRequest({
      params: organizationWorkspaceParamsSchema,
      json: createDocumentSchema,
    }),
    loadOrganizationResource<OrganizationWorkspaceParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    requireWorkspacePermission('write'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params, json } = getValidated<
        OrganizationWorkspaceParams,
        never,
        CreateDocumentInput
      >(context);
      const document = await documentService.createDocument({
        actorUserId: user.id,
        workspaceId: params.workspaceId,
        input: json,
      });
      return context.json({ document }, StatusCodes.CREATED);
    },
  );

  organizationWorkspaceDocumentsRoute.get(
    '/:documentId',
    requireAuth(),
    validateRequest({ params: organizationWorkspaceDocumentParamsSchema }),
    loadOrganizationResource<OrganizationWorkspaceDocumentParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    loadDocumentResourceInWorkspace<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      }),
    ),
    requireDocumentPermission('read'),
    async (context) => {
      const document = getDocumentResource(context);
      return context.json({ document }, StatusCodes.OK);
    },
  );

  organizationWorkspaceDocumentsRoute.patch(
    '/:documentId',
    requireAuth(),
    validateRequest({
      params: organizationWorkspaceDocumentParamsSchema,
      json: updateDocumentSchema,
    }),
    loadOrganizationResource<OrganizationWorkspaceDocumentParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    loadDocumentResourceInWorkspace<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      }),
    ),
    requireDocumentPermission('manage'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params, json } = getValidated<
        OrganizationWorkspaceDocumentParams,
        never,
        UpdateDocumentInput
      >(context);
      const document = await documentService.updateDocument({
        actorUserId: user.id,
        documentId: params.documentId,
        data: json,
      });
      return context.json({ document }, StatusCodes.OK);
    },
  );

  organizationWorkspaceDocumentsRoute.delete(
    '/:documentId/permanent',
    requireAuth(),
    validateRequest({ params: organizationWorkspaceDocumentParamsSchema }),
    loadOrganizationResource<OrganizationWorkspaceDocumentParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    loadDocumentResourceInWorkspace<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      }),
      { includeDeleted: true },
    ),
    requireDocumentPermission('manage'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params } =
        getValidated<OrganizationWorkspaceDocumentParams>(context);
      const document = await documentService.deleteDocument({
        actorUserId: user.id,
        documentId: params.documentId,
      });
      return context.json({ document }, StatusCodes.OK);
    },
  );

  organizationWorkspaceDocumentsRoute.delete(
    '/:documentId',
    requireAuth(),
    validateRequest({ params: organizationWorkspaceDocumentParamsSchema }),
    loadOrganizationResource<OrganizationWorkspaceDocumentParams>(
      ({ params }) => params.organizationId,
    ),
    loadWorkspaceResourceInOrganization<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
      }),
    ),
    loadDocumentResourceInWorkspace<OrganizationWorkspaceDocumentParams>(
      ({ params }) => ({
        workspaceId: params.workspaceId,
        documentId: params.documentId,
      }),
    ),
    requireDocumentPermission('manage'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params } =
        getValidated<OrganizationWorkspaceDocumentParams>(context);
      const document = await documentService.softDeleteDocument({
        actorUserId: user.id,
        documentId: params.documentId,
      });
      return context.json({ document }, StatusCodes.OK);
    },
  );

  return organizationWorkspaceDocumentsRoute;
}
