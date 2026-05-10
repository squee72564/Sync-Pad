import type { OrganizationService, WorkspaceService } from '@syncpad/core';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import { type AppVariables, CURRENT_USER_CONTEXT_KEY } from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import {
  type MeOrganizationsQuery,
  type MeWorkspacesQuery,
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
    .get('/', requireAuth(), async (context) => {
      const user = getCurrentUser(context);
      return context.json({ user }, StatusCodes.OK);
    })
    .get(
      '/workspaces',
      requireAuth(),
      validateRequest({ query: meWorkspacesQuerySchema }),
      async (context) => {
        const { query } = getValidated<never, MeWorkspacesQuery, never>(
          context,
        );
        const user = getCurrentUser(context);
        const result = await workspaceService.listReadableToUserPage({
          pagination: {
            limit: query.limit,
            cursor: query.cursor,
          },
          q: query.q,
          actorUserId: user.id,
        });

        return context.json(result, StatusCodes.OK);
      },
    )
    .get(
      '/organizations',
      requireAuth(),
      validateRequest({ query: meOrganizationsQuerySchema }),
      async (context) => {
        const { query } = getValidated<never, MeOrganizationsQuery, never>(
          context,
        );
        const user = getCurrentUser(context);
        const result = await organizationService.listOrganizationsForUserPage({
          pagination: {
            limit: query.limit,
            cursor: query.cursor,
          },
          q: query.q,
          actorUserId: user.id,
        });

        return context.json(result, StatusCodes.OK);
      },
    );
}
