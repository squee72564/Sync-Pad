import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { type AppVariables, WORKSPACE_CONTEXT_KEY } from '../lib/context.js';
import { AppError } from '../lib/error.js';
import { requireAuth } from '../middleware/authentication.js';
import { requireWorkspacePermission } from '../middleware/authorization.js';
import { loadWorkspace } from '../middleware/resource-loader.js';
import {
  getValidated,
  type Validated,
  validateRequest,
} from '../middleware/validation.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';
import {
  type AddWorkspaceMemberInput,
  addWorkspaceMemberSchema,
  type UpdateWorkspaceInput,
  type UpdateWorkspaceMemberInput,
  updateWorkspaceMemberSchema,
  updateWorkspaceSchema,
  type WorkspaceMembershipParams,
  type WorkspaceParams,
  workspaceMembershipParamsSchema,
  workspaceParamsSchema,
} from '../schemas/workspace.js';
import { workspaceService } from '../services/workspace-service.js';

export const workspacesRoute = new Hono<{ Variables: AppVariables }>();

const getLoadedWorkspace = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const workspace = context.get(WORKSPACE_CONTEXT_KEY);

  if (!workspace) {
    throw new AppError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Workspace route is missing loaded workspace context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return workspace;
};

workspacesRoute.get(
  '/:workspaceId',
  requireAuth(),
  validateRequest({ params: workspaceParamsSchema }),
  loadWorkspace<WorkspaceParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('read'),
  async (context) => {
    const workspace = getLoadedWorkspace(context);
    return context.json({ workspace }, StatusCodes.OK);
  },
);

workspacesRoute.patch(
  '/:workspaceId',
  requireAuth(),
  validateRequest({
    params: workspaceParamsSchema,
    json: updateWorkspaceSchema,
  }),
  loadWorkspace<WorkspaceParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params, json } =
      getValidated<
        Pick<
          Validated<WorkspaceParams, never, UpdateWorkspaceInput>,
          'params' | 'json'
        >
      >(context);
    const workspace = await workspaceService.updateWorkspace({
      workspaceId: params.workspaceId,
      data: json,
    });
    return context.json({ workspace }, StatusCodes.OK);
  },
);

workspacesRoute.delete(
  '/:workspaceId',
  requireAuth(),
  validateRequest({ params: workspaceParamsSchema }),
  loadWorkspace<WorkspaceParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params } =
      getValidated<Pick<Validated<WorkspaceParams>, 'params'>>(context);
    const workspace = await workspaceService.deleteWorkspace(
      params.workspaceId,
    );
    return context.json({ workspace }, StatusCodes.OK);
  },
);

workspacesRoute.get(
  '/:workspaceId/members',
  requireAuth(),
  validateRequest({ params: workspaceParamsSchema }),
  loadWorkspace<WorkspaceParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('read'),
  async (context) => {
    const { params } =
      getValidated<Pick<Validated<WorkspaceParams>, 'params'>>(context);
    const memberships = await workspaceRepository.listMemberships(
      params.workspaceId,
    );
    return context.json({ memberships }, StatusCodes.OK);
  },
);

workspacesRoute.post(
  '/:workspaceId/members',
  requireAuth(),
  validateRequest({
    params: workspaceParamsSchema,
    json: addWorkspaceMemberSchema,
  }),
  loadWorkspace<WorkspaceParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('invite'),
  async (context) => {
    const { params, json } =
      getValidated<
        Pick<
          Validated<WorkspaceParams, never, AddWorkspaceMemberInput>,
          'params' | 'json'
        >
      >(context);
    const workspace = getLoadedWorkspace(context);
    const membership = await workspaceService.addMember({
      organizationId: workspace.organizationId,
      workspaceId: params.workspaceId,
      userId: json.userId,
      role: json.workspaceRole,
    });
    return context.json({ membership }, StatusCodes.CREATED);
  },
);

workspacesRoute.patch(
  '/:workspaceId/members/:userId',
  requireAuth(),
  validateRequest({
    params: workspaceMembershipParamsSchema,
    json: updateWorkspaceMemberSchema,
  }),
  loadWorkspace<WorkspaceMembershipParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params, json } =
      getValidated<
        Pick<
          Validated<
            WorkspaceMembershipParams,
            never,
            UpdateWorkspaceMemberInput
          >,
          'params' | 'json'
        >
      >(context);
    if (json.workspaceRole === undefined) {
      throw new AppError({
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

workspacesRoute.delete(
  '/:workspaceId/members/:userId',
  requireAuth(),
  validateRequest({ params: workspaceMembershipParamsSchema }),
  loadWorkspace<WorkspaceMembershipParams>(({ params }) => params.workspaceId),
  requireWorkspacePermission('manage'),
  async (context) => {
    const { params } =
      getValidated<Pick<Validated<WorkspaceMembershipParams>, 'params'>>(
        context,
      );
    const membership = await workspaceService.deleteMember(
      params.workspaceId,
      params.userId,
    );
    return context.json({ membership }, StatusCodes.OK);
  },
);
