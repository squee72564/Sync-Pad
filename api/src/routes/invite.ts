import type { OrganizationService } from '@syncpad/core';
import { coreSchema, type InvitableOrganizationRole } from '@syncpad/db';
import type { PermissionChecker } from '@syncpad/permify';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  ORGANIZATION_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { createInviteToken, hashInviteToken } from '../lib/invite-token.js';
import { toOrganizationInviteResponse } from '../lib/organization-invite-response.js';
import type { Mailer } from '../mail/mailer.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.js';
import { createAuthorizationMiddleware } from '../middleware/authorization.js';
import { createOrganizationResourceLoader } from '../middleware/resource-loader.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import {
  type OrganizationInviteCreateUser,
  type OrganizationInviteIdParams,
  type OrganizationInviteParams,
  type OrganizationInviteQuery,
  organizationInviteCreateUserSchema,
  organizationInviteIdParamsSchema,
  organizationInviteParamsSchema,
  organizationInviteQuerySchema,
} from '../schemas/invite.js';
import {
  type OrganizationParams,
  organizationParamsSchema,
} from '../schemas/organization.js';

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

const getOrganizationResource = (
  context: Context<{ Variables: AppVariables }, string, object>,
) => {
  const organization = context.get(ORGANIZATION_CONTEXT_KEY);

  if (!organization) {
    throw new ApiError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      message: 'Organization route is missing loaded organization context',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }

  return organization;
};

const buildInviteExpiresAt = (mailService: Mailer, now = new Date()) =>
  new Date(
    now.getTime() + mailService.organizationInvite.ttlHours * 60 * 60 * 1000,
  );

const buildInviteUrls = ({
  mailService,
  organizationId,
  token,
}: {
  mailService: Mailer;
  organizationId: string;
  token: string;
}) => {
  const inviteUrl = new URL(
    `/invitations/${organizationId}/${token}`,
    mailService.organizationInvite.baseUrl,
  );
  const declineUrl = new URL(inviteUrl);
  declineUrl.searchParams.set('intent', 'decline');

  return {
    declineUrl: declineUrl.toString(),
    inviteUrl: inviteUrl.toString(),
  };
};

const toInvitePreview = ({
  organizationName,
  organizationInvitation,
}: {
  organizationName: string;
  organizationInvitation: Awaited<
    ReturnType<OrganizationService['getOrganizationInvitationByToken']>
  >;
}) => ({
  id: organizationInvitation.id,
  organizationId: organizationInvitation.organizationId,
  organizationName,
  email: organizationInvitation.email,
  organizationRole: organizationInvitation.organizationRole,
  status: organizationInvitation.status,
  expiresAt: organizationInvitation.expiresAt,
  isExpired: organizationInvitation.expiresAt <= new Date(),
});

const assertInviteCanBeSent = (
  organizationInvite: Awaited<
    ReturnType<OrganizationService['getOrganizationInvitationById']>
  >,
) => {
  if (organizationInvite.expiresAt <= new Date()) {
    throw new ApiError({
      code: 'ORGANIZATION_INVITATION_EXPIRED',
      expose: true,
      message: `Organization invite ${organizationInvite.id} has expired.`,
      status: StatusCodes.BAD_REQUEST,
      userMessage: 'Organization invite has expired.',
    });
  }

  if (organizationInvite.status !== 'pending') {
    throw new ApiError({
      code: 'ORGANIZATION_INVITATION_INVALID_STATUS',
      expose: true,
      message: `Organization invite ${organizationInvite.id} is ${organizationInvite.status}.`,
      status: StatusCodes.CONFLICT,
      userMessage: 'Organization invite status invalid.',
    });
  }
};

const assertInvitableOrganizationRole = (
  organizationRole: string,
): InvitableOrganizationRole => {
  if (
    coreSchema.invitableOrganizationRoleEnum.some(
      (invitableRole) => invitableRole === organizationRole,
    )
  ) {
    return organizationRole as InvitableOrganizationRole;
  }

  throw new ApiError({
    code: 'ORGANIZATION_INVITATION_INVALID_ROLE',
    expose: true,
    message: `Organization role ${organizationRole} cannot be invited.`,
    status: StatusCodes.CONFLICT,
    userMessage: 'Organization role cannot be invited.',
  });
};

export function createInvitationsRoute({
  organizationService,
  auth,
}: {
  organizationService: OrganizationService;
  auth: Auth;
}) {
  const { requireAuth } = createAuthenticationMiddleware({ auth });

  return new Hono<{ Variables: AppVariables }>()
    .get(
      '/token/:token',
      validateRequest({ params: organizationInviteParamsSchema }),
      async (context) => {
        const { params } = getValidated<OrganizationInviteParams>(context);
        const organizationInvitation =
          await organizationService.getOrganizationInvitationByToken({
            organizationId: params.organizationId,
            tokenHash: hashInviteToken(params.token),
          });
        const organization = await organizationService.findById(
          params.organizationId,
        );
        return context.json(
          {
            organizationInvitation: toInvitePreview({
              organizationInvitation,
              organizationName: organization?.name ?? params.organizationId,
            }),
          },
          StatusCodes.OK,
        );
      },
    )
    .post(
      '/token/:token/accept',
      requireAuth(),
      validateRequest({ params: organizationInviteParamsSchema }),
      async (context) => {
        const user = getCurrentUser(context);
        const { params } = getValidated<OrganizationInviteParams>(context);
        const acceptedOrganizationInvitation =
          await organizationService.acceptOrganizationInvitation({
            organizationId: params.organizationId,
            tokenHash: hashInviteToken(params.token),
            actorUserId: user.id,
            actorEmail: user.email,
          });

        return context.json(
          {
            membership: acceptedOrganizationInvitation.membership,
            acceptedOrganizationInvitation: toOrganizationInviteResponse(
              acceptedOrganizationInvitation.organizationInvite,
            ),
          },
          StatusCodes.OK,
        );
      },
    )
    .post(
      '/token/:token/decline',
      validateRequest({ params: organizationInviteParamsSchema }),
      async (context) => {
        const { params } = getValidated<OrganizationInviteParams>(context);
        const declinedOrganizationInvitation =
          await organizationService.declineOrganizationInvitation({
            organizationId: params.organizationId,
            tokenHash: hashInviteToken(params.token),
          });
        return context.json(
          {
            declinedOrganizationInvitation: toOrganizationInviteResponse(
              declinedOrganizationInvitation,
            ),
          },
          StatusCodes.OK,
        );
      },
    );
}

export function createOrganizationInvitationsRoute({
  organizationService,
  auth,
  mailService,
  permissionChecker,
}: {
  organizationService: OrganizationService;
  auth: Auth;
  mailService: Mailer;
  permissionChecker: PermissionChecker;
}) {
  const { loadOrganizationResource } = createOrganizationResourceLoader({
    organizationService,
  });
  const { requireOrganizationPermission } = createAuthorizationMiddleware({
    permissionChecker,
  });
  const { requireAuth } = createAuthenticationMiddleware({ auth });

  return new Hono<{ Variables: AppVariables }>()
    .get(
      '/',
      requireAuth(),
      validateRequest({
        params: organizationParamsSchema,
        query: organizationInviteQuerySchema,
      }),
      loadOrganizationResource<OrganizationParams>(
        ({ params }) => params.organizationId,
      ),
      requireOrganizationPermission('invite'),
      async (context) => {
        const { params, query } = getValidated<
          OrganizationParams,
          OrganizationInviteQuery
        >(context);
        const { organizationInvites, pageInfo } =
          await organizationService.listOrganizationInvitesForOrganizationPage({
            organizationId: params.organizationId,
            pagination: {
              limit: query.limit,
              cursor: query.cursor,
            },
            q: query.q,
            status: query.status,
          });

        return context.json(
          {
            organizationInvites: organizationInvites.map(
              toOrganizationInviteResponse,
            ),
            pageInfo,
          },
          StatusCodes.OK,
        );
      },
    )
    .post(
      '/',
      requireAuth(),
      validateRequest({
        params: organizationParamsSchema,
        json: organizationInviteCreateUserSchema,
      }),
      loadOrganizationResource<OrganizationParams>(
        ({ params }) => params.organizationId,
      ),
      requireOrganizationPermission('invite'),
      async (context) => {
        const user = getCurrentUser(context);
        const organization = getOrganizationResource(context);
        const { params, json } = getValidated<
          OrganizationParams,
          never,
          OrganizationInviteCreateUser
        >(context);

        const expiresAt = buildInviteExpiresAt(mailService);
        const token = createInviteToken();
        const tokenHash = hashInviteToken(token);
        const { declineUrl, inviteUrl } = buildInviteUrls({
          mailService,
          organizationId: params.organizationId,
          token,
        });

        const organizationInvite =
          await organizationService.createOrganizationInvitation({
            input: {
              email: json.email,
              expiresAt,
              organizationId: params.organizationId,
              organizationRole: json.organizationRole,
              tokenHash,
            },
            actorUserId: user.id,
          });

        try {
          await mailService.sendOrganizationInvite({
            declineUrl,
            inviteUrl,
            organizationName: organization.name,
            inviterName: user.name,
            inviterEmail: user.email,
            recipientEmail: json.email,
            role: json.organizationRole,
            expiresAt,
          });
        } catch (error) {
          await organizationService.revokeOrganizationInvitation({
            organizationId: params.organizationId,
            tokenHash: organizationInvite.tokenHash,
          });
          throw error;
        }

        const sentOrganizationInvite =
          await organizationService.markOrganizationInvitationSent({
            organizationId: params.organizationId,
            tokenHash: organizationInvite.tokenHash,
            sentAt: new Date(),
          });

        return context.json(
          {
            organizationInvite: toOrganizationInviteResponse(
              sentOrganizationInvite,
            ),
          },
          StatusCodes.CREATED,
        );
      },
    )
    .post(
      '/:invitationId/resend',
      requireAuth(),
      validateRequest({ params: organizationInviteIdParamsSchema }),
      loadOrganizationResource<OrganizationInviteIdParams>(
        ({ params }) => params.organizationId,
      ),
      requireOrganizationPermission('invite'),
      async (context) => {
        const user = getCurrentUser(context);
        const organization = getOrganizationResource(context);
        const { params } = getValidated<OrganizationInviteIdParams>(context);
        const organizationInvite =
          await organizationService.getOrganizationInvitationById({
            organizationId: params.organizationId,
            organizationInviteId: params.invitationId,
          });
        const organizationRole = assertInvitableOrganizationRole(
          organizationInvite.organizationRole,
        );

        assertInviteCanBeSent(organizationInvite);

        const token = createInviteToken();
        const tokenHash = hashInviteToken(token);
        const { declineUrl, inviteUrl } = buildInviteUrls({
          mailService,
          organizationId: params.organizationId,
          token,
        });

        await mailService.sendOrganizationInvite({
          declineUrl,
          inviteUrl,
          organizationName: organization.name,
          inviterName: user.name,
          inviterEmail: user.email,
          recipientEmail: organizationInvite.email,
          role: organizationRole,
          expiresAt: organizationInvite.expiresAt,
        });

        const resentOrganizationInvite =
          await organizationService.rotateOrganizationInvitationToken({
            organizationInviteId: organizationInvite.id,
            organizationId: params.organizationId,
            tokenHash,
            sentAt: new Date(),
          });

        return context.json(
          {
            resentOrganizationInvite: toOrganizationInviteResponse(
              resentOrganizationInvite,
            ),
          },
          StatusCodes.OK,
        );
      },
    )
    .delete(
      '/:invitationId',
      requireAuth(),
      validateRequest({ params: organizationInviteIdParamsSchema }),
      loadOrganizationResource<OrganizationInviteIdParams>(
        ({ params }) => params.organizationId,
      ),
      requireOrganizationPermission('invite'),
      async (context) => {
        const { params } = getValidated<OrganizationInviteIdParams>(context);
        const organizationInvite =
          await organizationService.getOrganizationInvitationById({
            organizationId: params.organizationId,
            organizationInviteId: params.invitationId,
          });

        const revokedOrganizationInvite =
          await organizationService.revokeOrganizationInvitation({
            organizationId: params.organizationId,
            tokenHash: organizationInvite.tokenHash,
          });

        return context.json(
          {
            revokedOrganizationInvite: toOrganizationInviteResponse(
              revokedOrganizationInvite,
            ),
          },
          StatusCodes.OK,
        );
      },
    );
}
