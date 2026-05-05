import type {
  DocumentService,
  OrganizationService,
  WorkspaceService,
} from '@syncpad/core';
import type { MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import {
  type AppVariables,
  DOCUMENT_CONTEXT_KEY,
  ORGANIZATION_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { getValidated } from './validation.js';

type ValidatedParams<TParams> = { params: TParams };

export function createResourceLoader({
  documentService,
  organizationService,
  workspaceService,
}: {
  documentService?: DocumentService;
  organizationService: OrganizationService;
  workspaceService: WorkspaceService;
}) {
  return {
    loadOrganizationResource: <TParams>(
      selectOrganizationId: (validated: { params: TParams }) => string,
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const validated = getValidated<TParams>(
          context,
        ) as ValidatedParams<TParams>;
        const organizationId = selectOrganizationId(validated);

        if (organizationId.length === 0) {
          throw new ApiError({
            code: 'ORGANIZATION_NOT_FOUND',
            expose: true,
            message: 'Missing validated organization id from request params',
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Organization not found.',
          });
        }

        const organization = await organizationService.findById(organizationId);

        if (!organization) {
          throw new ApiError({
            code: 'ORGANIZATION_NOT_FOUND',
            expose: true,
            message: `Organization ${organizationId} was not found`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Organization not found.',
          });
        }

        context.set(ORGANIZATION_CONTEXT_KEY, organization);
        await next();
      };
    },

    loadWorkspaceResource: <TParams>(
      selectWorkspaceId: (validated: { params: TParams }) => string,
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const validated = getValidated<TParams>(
          context,
        ) as ValidatedParams<TParams>;
        const workspaceId = selectWorkspaceId(validated);

        if (workspaceId.length === 0) {
          throw new ApiError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            message: 'Missing validated workspace id from request params',
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace not found.',
          });
        }

        const workspace = await workspaceService.findById(workspaceId);

        if (!workspace) {
          throw new ApiError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            message: `Workspace ${workspaceId} was not found`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace not found.',
          });
        }

        context.set(WORKSPACE_CONTEXT_KEY, workspace);
        await next();
      };
    },

    loadWorkspaceResourceInOrganization: <TParams>(
      selectIds: (validated: { params: TParams }) => {
        organizationId: string;
        workspaceId: string;
      },
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const validated = getValidated<TParams>(
          context,
        ) as ValidatedParams<TParams>;
        const { organizationId, workspaceId } = selectIds(validated);

        if (organizationId.length === 0 || workspaceId.length === 0) {
          throw new ApiError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            message:
              'Missing validated organization or workspace id from request params',
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace not found.',
          });
        }

        const workspace = await workspaceService.findInOrganization({
          organizationId,
          workspaceId,
        });

        if (!workspace) {
          throw new ApiError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            message: `Workspace ${workspaceId} was not found in organization ${organizationId}`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace not found.',
          });
        }

        context.set(WORKSPACE_CONTEXT_KEY, workspace);
        await next();
      };
    },

    loadDocumentResourceInWorkspace: <TParams>(
      selectIds: (validated: { params: TParams }) => {
        workspaceId: string;
        documentId: string;
      },
      options?: { includeDeleted?: boolean },
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        if (!documentService) {
          throw new ApiError({
            code: 'RESOURCE_LOADER_MISCONFIGURED',
            message: 'Document service is required to load document resources',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          });
        }

        const validated = getValidated<TParams>(
          context,
        ) as ValidatedParams<TParams>;
        const { workspaceId, documentId } = selectIds(validated);

        if (workspaceId.length === 0 || documentId.length === 0) {
          throw new ApiError({
            code: 'DOCUMENT_NOT_FOUND',
            expose: true,
            message:
              'Missing validated workspace or document id from request params',
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Document not found.',
          });
        }

        const document = await documentService.findInWorkspace({
          workspaceId,
          documentId,
          includeDeleted: options?.includeDeleted,
        });

        if (!document) {
          throw new ApiError({
            code: 'DOCUMENT_NOT_FOUND',
            expose: true,
            message: `Document ${documentId} was not found in workspace ${workspaceId}`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Document not found.',
          });
        }

        context.set(DOCUMENT_CONTEXT_KEY, document);
        await next();
      };
    },
  };
}
