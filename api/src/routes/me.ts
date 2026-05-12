import type { OrganizationService, WorkspaceService } from '@syncpad/core';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import { type AppVariables, CURRENT_USER_CONTEXT_KEY } from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createInviteToken, hashInviteToken } from '../lib/invite-token.js';
import { toMeOrganizationInviteResponse } from '../lib/organization-invite-response.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import {
  type MeOrganizationInviteParams,
  type MeOrganizationInvitesQuery,
  type MeOrganizationsQuery,
  type MeWorkspacesQuery,
  meOrganizationInviteParamsSchema,
  meOrganizationInvitesQuerySchema,
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
    )
    .get(
      '/invitations',
      requireAuth(),
      validateRequest({ query: meOrganizationInvitesQuerySchema }),
      async (context) => {
        const { query } = getValidated<
          never,
          MeOrganizationInvitesQuery,
          never
        >(context);
        const user = getCurrentUser(context);
        const { organizationInvites, pageInfo } =
          await organizationService.listOrganizationInvitesForUserPage({
            pagination: {
              limit: query.limit,
              cursor: query.cursor,
            },
            q: query.q,
            status: query.status,
            userEmail: user.email,
          });

        return context.json(
          {
            organizationInvites: organizationInvites.map(
              toMeOrganizationInviteResponse,
            ),
            pageInfo,
          },
          StatusCodes.OK,
        );
      },
    )
    .post(
      '/invitations/:invitationId/link',
      requireAuth(),
      validateRequest({ params: meOrganizationInviteParamsSchema }),
      async (context) => {
        const { params } = getValidated<MeOrganizationInviteParams>(context);
        const user = getCurrentUser(context);
        const organizationInvitation =
          await organizationService.getOrganizationInvitationForUserById({
            organizationInviteId: params.invitationId,
            userEmail: user.email,
          });

        if (organizationInvitation.expiresAt <= new Date()) {
          throw new ApiError({
            code: 'ORGANIZATION_INVITATION_EXPIRED',
            expose: true,
            message: `Organization invite ${organizationInvitation.id} has expired.`,
            status: StatusCodes.BAD_REQUEST,
            userMessage: 'Organization invite has expired.',
          });
        }

        if (organizationInvitation.status !== 'pending') {
          throw new ApiError({
            code: 'ORGANIZATION_INVITATION_INVALID_STATUS',
            expose: true,
            message: `Organization invite ${organizationInvitation.id} is ${organizationInvitation.status}.`,
            status: StatusCodes.CONFLICT,
            userMessage: 'Organization invite status invalid.',
          });
        }

        const token = createInviteToken();
        await organizationService.rotateOrganizationInvitationTokenForOpen({
          organizationInviteId: organizationInvitation.id,
          organizationId: organizationInvitation.organizationId,
          tokenHash: hashInviteToken(token),
          rotatedAt: new Date(),
        });
        return context.json(
          {
            inviteUrl: `/invitations/${organizationInvitation.organizationId}/${token}`,
          },
          StatusCodes.OK,
        );
      },
    );
}
