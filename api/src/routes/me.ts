import type { OrganizationService, WorkspaceService } from '@syncpad/core';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import { type AppVariables, CURRENT_USER_CONTEXT_KEY } from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { validateRequest } from '../middleware/validation.js';
import {
  meOrganizationsQuerySchema,
  meWorkspacesQuerySchema,
} from '../schemas/me.js';

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

export function createMeRoute({
  workspaceService,
  organizationService,
  auth,
}: {
  workspaceService: WorkspaceService;
  organizationService: OrganizationService;
  auth: Auth;
}) {
  const { requireAuth } = createAuthenticationMiddleware({ auth });
  return new Hono<{ Variables: AppVariables }>()
    .get(
      '/',
      requireAuth(),
      validateRequest({ query: meWorkspacesQuerySchema }),
      async (context) => {
        const user = getCurrentUser(context);
        return context.json({ user }, StatusCodes.OK);
      },
    )
    .get(
      '/workspaces',
      requireAuth(),
      validateRequest({ query: meWorkspacesQuerySchema }),
      async (context) => {
        const user = getCurrentUser(context);
        const workspaces = await workspaceService.listReadableToUser({
          actorUserId: user.id,
        });

        return context.json({ workspaces }, StatusCodes.OK);
      },
    )
    .get(
      '/organizations',
      requireAuth(),
      validateRequest({ query: meOrganizationsQuerySchema }),
      async (context) => {
        const user = getCurrentUser(context);
        const organizations =
          await organizationService.listOrganizationsForUser(user.id);

        return context.json({ organizations }, StatusCodes.OK);
      },
    );
}
