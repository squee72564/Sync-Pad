import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { requireAuth } from '../middleware/authentication.js';
import {
  requireOrganizationPermission,
  requireWorkspacePermission,
} from '../middleware/authorization.js';
import {
  loadOrganizationResource,
  loadWorkspaceResourceInOrganization,
} from '../middleware/resource-loader.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';
import {
  type OrganizationParams,
  organizationParamsSchema,
} from '../schemas/organization.js';
import {
  type AddWorkspaceMemberInput,
  addWorkspaceMemberSchema,
  type CreateWorkspaceInput,
  createWorkspaceSchema,
  type OrganizationWorkspaceMembershipParams,
  type OrganizationWorkspaceParams,
  organizationWorkspaceMembershipParamsSchema,
  organizationWorkspaceParamsSchema,
  type UpdateWorkspaceInput,
  type UpdateWorkspaceMemberInput,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
} from '../schemas/workspace.js';
import { workspaceService } from '../services/workspace-service.js';

export const organizationWorkspacesRoute = new Hono<{
  Variables: AppVariables;
}>();

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

const getWorkspaceResource = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const workspace = context.get(WORKSPACE_CONTEXT_KEY);

  if (!workspace) {
    throw new ApiError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Workspace route is missing loaded workspace context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return workspace;
};

organizationWorkspacesRoute.get(
  '/',
  requireAuth(),
  validateRequest({ params: organizationParamsSchema }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('read'),
  async (context) => {
    const user = getCurrentUser(context);
    const { params } = getValidated<OrganizationParams>(context);
    const workspaces = await workspaceService.listByOrganizationReadableToUser({
      actorUserId: user.id,
      organizationId: params.organizationId,
    });
    return context.json({ workspaces }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.post(
  '/',
  requireAuth(),
  validateRequest({
    params: organizationParamsSchema,
    json: createWorkspaceSchema,
  }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('create_workspace'),
  async (context) => {
    const user = getCurrentUser(context);
    const { params, json } = getValidated<
      OrganizationParams,
      never,
      CreateWorkspaceInput
    >(context);
    const workspace = await workspaceService.createWorkspace({
      actorUserId: user.id,
      organizationId: params.organizationId,
      input: json,
    });
    return context.json({ workspace }, StatusCodes.CREATED);
  },
);

organizationWorkspacesRoute.get(
  '/:workspaceId',
  requireAuth(),
  validateRequest({ params: organizationWorkspaceParamsSchema }),
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
    const workspace = getWorkspaceResource(context);
    return context.json({ workspace }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.patch(
  '/:workspaceId',
  requireAuth(),
  validateRequest({
    params: organizationWorkspaceParamsSchema,
    json: updateWorkspaceSchema,
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
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params, json } = getValidated<
      OrganizationWorkspaceParams,
      never,
      UpdateWorkspaceInput
    >(context);
    const workspace = await workspaceService.updateWorkspace({
      workspaceId: params.workspaceId,
      data: json,
    });
    return context.json({ workspace }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.delete(
  '/:workspaceId',
  requireAuth(),
  validateRequest({ params: organizationWorkspaceParamsSchema }),
  loadOrganizationResource<OrganizationWorkspaceParams>(
    ({ params }) => params.organizationId,
  ),
  loadWorkspaceResourceInOrganization<OrganizationWorkspaceParams>(
    ({ params }) => ({
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
    }),
  ),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params } = getValidated<OrganizationWorkspaceParams>(context);
    const workspace = await workspaceService.deleteWorkspace(
      params.workspaceId,
    );
    return context.json({ workspace }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.get(
  '/:workspaceId/members',
  requireAuth(),
  validateRequest({ params: organizationWorkspaceParamsSchema }),
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
    const { params } = getValidated<OrganizationWorkspaceParams>(context);
    const memberships = await workspaceRepository.listMemberships(
      params.workspaceId,
    );
    return context.json({ memberships }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.post(
  '/:workspaceId/members',
  requireAuth(),
  validateRequest({
    params: organizationWorkspaceParamsSchema,
    json: addWorkspaceMemberSchema,
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
  requireWorkspacePermission('invite'),
  async (context) => {
    const { params, json } = getValidated<
      OrganizationWorkspaceParams,
      never,
      AddWorkspaceMemberInput
    >(context);
    const workspace = getWorkspaceResource(context);
    const membership = await workspaceService.addMember({
      organizationId: workspace.organizationId,
      workspaceId: params.workspaceId,
      userId: json.userId,
      role: json.workspaceRole,
    });
    return context.json({ membership }, StatusCodes.CREATED);
  },
);

organizationWorkspacesRoute.patch(
  '/:workspaceId/members/:userId',
  requireAuth(),
  validateRequest({
    params: organizationWorkspaceMembershipParamsSchema,
    json: updateWorkspaceMemberSchema,
  }),
  loadOrganizationResource<OrganizationWorkspaceMembershipParams>(
    ({ params }) => params.organizationId,
  ),
  loadWorkspaceResourceInOrganization<OrganizationWorkspaceMembershipParams>(
    ({ params }) => ({
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
    }),
  ),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params, json } = getValidated<
      OrganizationWorkspaceMembershipParams,
      never,
      UpdateWorkspaceMemberInput
    >(context);
    if (json.workspaceRole === undefined) {
      throw new ApiError({
        code: 'AUTHORIZATION_CONTEXT_INVALID',
        message:
          'Workspace membership update route is missing validated workspace role',
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
    const membership = await workspaceService.updateMember({
      workspaceId: params.workspaceId,
      userId: params.userId,
      role: json.workspaceRole,
    });
    return context.json({ membership }, StatusCodes.OK);
  },
);

organizationWorkspacesRoute.delete(
  '/:workspaceId/members/:userId',
  requireAuth(),
  validateRequest({ params: organizationWorkspaceMembershipParamsSchema }),
  loadOrganizationResource<OrganizationWorkspaceMembershipParams>(
    ({ params }) => params.organizationId,
  ),
  loadWorkspaceResourceInOrganization<OrganizationWorkspaceMembershipParams>(
    ({ params }) => ({
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
    }),
  ),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params } =
      getValidated<OrganizationWorkspaceMembershipParams>(context);
    const membership = await workspaceService.deleteMember(
      params.workspaceId,
      params.userId,
    );
    return context.json({ membership }, StatusCodes.OK);
  },
);
