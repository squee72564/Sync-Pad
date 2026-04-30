import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';

import { type AppVariables, CURRENT_USER_CONTEXT_KEY } from '../lib/context.js';
import { AppError } from '../lib/error.js';
import { requireAuth } from '../middleware/authentication.js';
import { validateRequest } from '../middleware/validation.js';
import {
  meOrganizationsQuerySchema,
  meWorkspacesQuerySchema,
} from '../schemas/me.js';
import { organizationService } from '../services/organization-service.js';
import { workspaceService } from '../services/workspace-service.js';

export const meRoute = new Hono<{ Variables: AppVariables }>();

const getCurrentUser = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const user = context.get(CURRENT_USER_CONTEXT_KEY);

  if (!user) {
    throw new AppError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Authenticated route is missing current user context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return user;
};

meRoute.get(
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
);

meRoute.get(
  '/organizations',
  requireAuth(),
  validateRequest({ query: meOrganizationsQuerySchema }),
  async (context) => {
    const user = getCurrentUser(context);
    const organizations = await organizationService.listOrganizationsForUser(
      user.id,
    );

    return context.json({ organizations }, StatusCodes.OK);
  },
);
