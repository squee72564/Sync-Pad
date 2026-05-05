import {
  type DocumentPermission,
  type OrganizationPermission,
  type PermissionChecker,
  resources,
  subjects,
  type WorkspacePermission,
} from '@syncpad/permify';
import type { Context, MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import {
  type AppVariables,
  AUTHORIZATION_CONTEXT_KEY,
  CURRENT_USER_CONTEXT_KEY,
  DOCUMENT_CONTEXT_KEY,
  ORGANIZATION_CONTEXT_KEY,
  VALIDATED_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';

const forbiddenPermissionError = ({
  resource,
  permission,
}: {
  resource: string;
  permission: string;
}) => {
  return new ApiError({
    code: 'FORBIDDEN',
    expose: true,
    message: `Permission denied for ${resource} ${permission}`,
    status: StatusCodes.FORBIDDEN,
    userMessage: 'You do not have permission to perform this action.',
  });
};

const getValidatedParam = (
  context: Context<{ Variables: AppVariables }, string, object>,
  paramName: string,
): string | null => {
  const validated = context.get(VALIDATED_CONTEXT_KEY);
  const params = validated?.params as
    | Record<string, string | undefined>
    | undefined;
  return params?.[paramName] ?? null;
};

const getCurrentUserAndFail = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const user = context.get(CURRENT_USER_CONTEXT_KEY);

  if (!user) {
    throw new ApiError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Missing authenticated user for authorization check',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return user;
};

export function createAuthorizationMiddleware({
  permissionChecker,
}: {
  permissionChecker: PermissionChecker;
}) {
  return {
    requireOrganizationPermission: (
      permission: OrganizationPermission,
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const user = getCurrentUserAndFail(context);
        const organization = context.get(ORGANIZATION_CONTEXT_KEY);
        const organizationId =
          organization?.id ?? getValidatedParam(context, 'organizationId');

        if (!organizationId) {
          throw new ApiError({
            code: 'AUTHORIZATION_CONTEXT_INVALID',
            message: 'Missing organizationId for authorization check',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          });
        }

        const allowed = await permissionChecker.checkPermission(
          subjects.user(user.id),
          resources.organization(organizationId),
          permission,
        );

        if (!allowed) {
          throw forbiddenPermissionError({
            resource: `organization:${organizationId}`,
            permission,
          });
        }

        context.set(AUTHORIZATION_CONTEXT_KEY, {
          checked: true,
          permission,
          resource: `organization:${organizationId}`,
        });
        await next();
      };
    },

    requireWorkspacePermission: (
      permission: WorkspacePermission,
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const user = getCurrentUserAndFail(context);
        const workspace = context.get(WORKSPACE_CONTEXT_KEY);
        const workspaceId =
          workspace?.id ?? getValidatedParam(context, 'workspaceId');

        if (!workspaceId) {
          throw new ApiError({
            code: 'AUTHORIZATION_CONTEXT_INVALID',
            message: 'Missing workspaceId for authorization check',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          });
        }

        const allowed = await permissionChecker.checkPermission(
          subjects.user(user.id),
          resources.workspace(workspaceId),
          permission,
        );

        if (!allowed) {
          throw forbiddenPermissionError({
            resource: `workspace:${workspaceId}`,
            permission,
          });
        }

        context.set(AUTHORIZATION_CONTEXT_KEY, {
          checked: true,
          permission,
          resource: `workspace:${workspaceId}`,
        });
        await next();
      };
    },

    requireDocumentPermission: (
      permission: DocumentPermission,
    ): MiddlewareHandler<{ Variables: AppVariables }> => {
      return async (context, next) => {
        const user = getCurrentUserAndFail(context);
        const document = context.get(DOCUMENT_CONTEXT_KEY);
        const documentId =
          document?.id ?? getValidatedParam(context, 'documentId');

        if (!documentId) {
          throw new ApiError({
            code: 'AUTHORIZATION_CONTEXT_INVALID',
            message: 'Missing documentId for authorization check',
            status: StatusCodes.INTERNAL_SERVER_ERROR,
          });
        }

        const allowed = await permissionChecker.checkPermission(
          subjects.user(user.id),
          resources.document(documentId),
          permission,
        );

        if (!allowed) {
          throw forbiddenPermissionError({
            resource: `document:${documentId}`,
            permission,
          });
        }

        context.set(AUTHORIZATION_CONTEXT_KEY, {
          checked: true,
          permission,
          resource: `document:${documentId}`,
        });
        await next();
      };
    },
  };
}
