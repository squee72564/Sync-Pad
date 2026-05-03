import type { MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';

import {
  type AppVariables,
  ORGANIZATION_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';
import { getValidated } from './validation.js';

type ValidatedParams<TParams> = { params: TParams };

export const loadOrganizationResource = <TParams>(
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

    const organization = await organizationRepository.findById(organizationId);

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
};

export const loadWorkspaceResource = <TParams>(
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

    const workspace = await workspaceRepository.findById(workspaceId);

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
};

export const loadWorkspaceResourceInOrganization = <TParams>(
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

    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace || workspace.organizationId !== organizationId) {
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
};
