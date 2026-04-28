import type { Context, MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { checkPermission } from '../authz/permify-client.js';
import type {
  OrganizationPermission,
  WorkspacePermission,
} from '../authz/permissions.js';
import { resources } from '../authz/permissions.js';
import {
  type AppVariables,
  AUTHORIZATION_CONTEXT_KEY,
  CURRENT_USER_CONTEXT_KEY,
  ORGANIZATION_CONTEXT_KEY,
  VALIDATED_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { AppError } from '../lib/error.js';

const getCurrentUserAndFail = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const user = context.get(CURRENT_USER_CONTEXT_KEY);

  if (!user) {
    throw new AppError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Missing authenticated user for authorization check',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return user;
};

export const requireOrganizationPermission = (
  permission: OrganizationPermission,
): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (context, next) => {
    const user = getCurrentUserAndFail(context);
    const organization = context.get(ORGANIZATION_CONTEXT_KEY);
    const validated = context.get(VALIDATED_CONTEXT_KEY);
    const organizationId =
      organization?.id ??
      (validated.params as { organizationId?: string } | undefined)
        ?.organizationId ??
      null;

    if (!organizationId) {
      throw new AppError({
        code: 'AUTHORIZATION_CONTEXT_INVALID',
        message: 'Missing organization id for authorization check',
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    const allowed = await checkPermission(
      user.id,
      resources.organization(organizationId),
      permission,
    );

    if (!allowed) {
      throw new AppError({
        code: 'FORBIDDEN',
        expose: true,
        message: `Permission denied for organization:${organizationId} ${permission}`,
        status: StatusCodes.FORBIDDEN,
        userMessage: 'You do not have permission to perform this action.',
      });
    }

    context.set(AUTHORIZATION_CONTEXT_KEY, {
      checked: true,
      permission,
      resource: `organization:${organizationId}`,
    });
    await next();
  };
};

export const requireWorkspacePermission = (
  permission: WorkspacePermission,
): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (context, next) => {
    const user = getCurrentUserAndFail(context);
    const workspace = context.get(WORKSPACE_CONTEXT_KEY);
    const validated = context.get(VALIDATED_CONTEXT_KEY);
    const workspaceId =
      workspace?.id ??
      (validated.params as { workspaceId?: string } | undefined)?.workspaceId ??
      null;

    if (!workspaceId) {
      throw new AppError({
        code: 'AUTHORIZATION_CONTEXT_INVALID',
        message: 'Missing workspace id for authorization check',
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    const allowed = await checkPermission(
      user.id,
      resources.workspace(workspaceId),
      permission,
    );

    if (!allowed) {
      throw new AppError({
        code: 'FORBIDDEN',
        expose: true,
        message: `Permission denied for workspace:${workspaceId} ${permission}`,
        status: StatusCodes.FORBIDDEN,
        userMessage: 'You do not have permission to perform this action.',
      });
    }

    context.set(AUTHORIZATION_CONTEXT_KEY, {
      checked: true,
      permission,
      resource: `workspace:${workspaceId}`,
    });
    await next();
  };
};
