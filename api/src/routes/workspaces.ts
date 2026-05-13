import type { OrganizationService, WorkspaceService } from '@syncpad/core';
import type { PermissionChecker } from '@syncpad/permify';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  WORKSPACE_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { createAuthorizationMiddleware } from '../middleware/authorization.js';
import { createOrganizationWorkspaceResourceLoader } from '../middleware/resource-loader.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
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
  type WorkspaceQuery,
  workspaceQuerySchema,
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

export function createOrganizationWorkspacesRoute({
  organizationService,
  workspaceService,
  permissionChecker,
  auth,
}: {
  organizationService: OrganizationService;
  workspaceService: WorkspaceService;
  permissionChecker: PermissionChecker;
  auth: Auth;
}) {
  const organizationWorkspacesRoute = new Hono<{
    Variables: AppVariables;
  }>();
  const { loadOrganizationResource, loadWorkspaceResourceInOrganization } =
    createOrganizationWorkspaceResourceLoader({
      organizationService,
      workspaceService,
    });
  const { requireOrganizationPermission, requireWorkspacePermission } =
    createAuthorizationMiddleware({
      permissionChecker,
    });
  const { requireAuth } = createAuthenticationMiddleware({ auth });

  organizationWorkspacesRoute.get(
    '/',
    requireAuth(),
    validateRequest({
      params: organizationParamsSchema,
      query: workspaceQuerySchema,
    }),
    loadOrganizationResource<OrganizationParams>(
      ({ params }) => params.organizationId,
    ),
    requireOrganizationPermission('read'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params, query } = getValidated<
        OrganizationParams,
        WorkspaceQuery
      >(context);
      const { workspaces, pageInfo } =
        await workspaceService.listByOrganizationReadableToUserPage({
          actorUserId: user.id,
          organizationId: params.organizationId,
          q: query.q,
          pagination: {
            cursor: query.cursor,
            limit: query.limit,
          },
        });
      return context.json({ workspaces, pageInfo }, StatusCodes.OK);
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
      const access = await workspaceService.getWorkspaceAccess({
        actorUserId: user.id,
        workspaceId: workspace.id,
        permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
      });

      return context.json({ workspace, access }, StatusCodes.CREATED);
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
      const user = getCurrentUser(context);

      const access = await workspaceService.getWorkspaceAccess({
        actorUserId: user.id,
        workspaceId: workspace.id,
        permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
      });

      return context.json({ workspace, access }, StatusCodes.OK);
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
      if (!workspace) {
        throw new ApiError({
          code: 'WORKSPACE_NOT_FOUND',
          expose: true,
          message: `Workspace ${params.workspaceId} was not found during update`,
          status: StatusCodes.NOT_FOUND,
          userMessage: 'Workspace not found.',
        });
      }
      const user = getCurrentUser(context);
      const access = await workspaceService.getWorkspaceAccess({
        actorUserId: user.id,
        workspaceId: params.workspaceId,
        permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
      });

      return context.json({ workspace, access }, StatusCodes.OK);
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
    '/:workspaceId/access',
    requireAuth(),
    validateRequest({
      params: organizationWorkspaceParamsSchema,
    }),
    requireWorkspacePermission('read'),
    async (context) => {
      const user = getCurrentUser(context);
      const { params } = getValidated<OrganizationWorkspaceParams>(context);
      const access = await workspaceService.getWorkspaceAccess({
        actorUserId: user.id,
        workspaceId: params.workspaceId,
        permissions: ['comment', 'write', 'read', 'manage', 'invite', 'run_ai'],
      });
      return context.json({ access }, StatusCodes.OK);
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
      const memberships =
        await workspaceService.listMembershipsWithUserProfiles(
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

  return organizationWorkspacesRoute;
}
