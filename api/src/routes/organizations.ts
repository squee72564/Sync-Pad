import type { Context } from 'hono';
import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  ORGANIZATION_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import { requireAuth } from '../middleware/authentication.js';
import { requireOrganizationPermission } from '../middleware/authorization.js';
import { loadOrganizationResource } from '../middleware/resource-loader.js';
import { getValidated, validateRequest } from '../middleware/validation.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import {
  type AddOrganizationMemberInput,
  addOrganizationMemberSchema,
  type CreateOrganizationInput,
  createOrganizationSchema,
  type OrganizationMembershipParams,
  type OrganizationParams,
  organizationMembershipParamsSchema,
  organizationParamsSchema,
  type UpdateOrganizationInput,
  type UpdateOrganizationMemberInput,
  updateOrganizationMemberSchema,
  updateOrganizationSchema,
} from '../schemas/organization.js';
import { organizationService } from '../services/organization-service.js';

export const organizationsRoute = new Hono<{ Variables: AppVariables }>();

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

organizationsRoute.get('/', requireAuth(), async (context) => {
  const user = getCurrentUser(context);
  const organizations = await organizationService.listOrganizationsForUser(
    user.id,
  );
  return context.json({ organizations }, StatusCodes.OK);
});

organizationsRoute.post(
  '/',
  requireAuth(),
  validateRequest({ json: createOrganizationSchema }),
  async (context) => {
    const user = getCurrentUser(context);
    const { json } = getValidated<never, never, CreateOrganizationInput>(
      context,
    );
    const organization = await organizationService.createOrganization({
      actorUserId: user.id,
      input: json,
    });
    return context.json({ organization }, StatusCodes.CREATED);
  },
);

organizationsRoute.get(
  '/:organizationId',
  requireAuth(),
  validateRequest({ params: organizationParamsSchema }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('read'),
  async (context) => {
    const organization = getOrganizationResource(context);
    return context.json({ organization }, StatusCodes.OK);
  },
);

organizationsRoute.patch(
  '/:organizationId',
  requireAuth(),
  validateRequest({
    params: organizationParamsSchema,
    json: updateOrganizationSchema,
  }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('manage'),
  async (context) => {
    const { params, json } = getValidated<
      OrganizationParams,
      never,
      UpdateOrganizationInput
    >(context);
    const organization = await organizationService.updateOrganization({
      organizationId: params.organizationId,
      input: json,
    });
    return context.json({ organization }, StatusCodes.OK);
  },
);

organizationsRoute.get(
  '/:organizationId/members',
  requireAuth(),
  validateRequest({ params: organizationParamsSchema }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('read'),
  async (context) => {
    const { params } = getValidated<OrganizationParams>(context);
    const memberships = await organizationRepository.listMemberships(
      params.organizationId,
    );
    return context.json({ memberships }, StatusCodes.OK);
  },
);

organizationsRoute.post(
  '/:organizationId/members',
  requireAuth(),
  validateRequest({
    params: organizationParamsSchema,
    json: addOrganizationMemberSchema,
  }),
  loadOrganizationResource<OrganizationParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('invite'),
  async (context) => {
    const user = getCurrentUser(context);
    const { params, json } = getValidated<
      OrganizationParams,
      never,
      AddOrganizationMemberInput
    >(context);
    const membership = await organizationService.addMember({
      actorUserId: user.id,
      organizationId: params.organizationId,
      userId: json.userId,
      input: json,
    });
    return context.json({ membership }, StatusCodes.CREATED);
  },
);

organizationsRoute.patch(
  '/:organizationId/members/:userId',
  requireAuth(),
  validateRequest({
    params: organizationMembershipParamsSchema,
    json: updateOrganizationMemberSchema,
  }),
  loadOrganizationResource<OrganizationMembershipParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('manage'),
  async (context) => {
    const { params, json } = getValidated<
      OrganizationMembershipParams,
      never,
      UpdateOrganizationMemberInput
    >(context);
    const membership = await organizationService.updateMember({
      organizationId: params.organizationId,
      userId: params.userId,
      input: json,
    });
    return context.json({ membership }, StatusCodes.OK);
  },
);

organizationsRoute.delete(
  '/:organizationId/members/:userId',
  requireAuth(),
  validateRequest({ params: organizationMembershipParamsSchema }),
  loadOrganizationResource<OrganizationMembershipParams>(
    ({ params }) => params.organizationId,
  ),
  requireOrganizationPermission('manage'),
  async (context) => {
    const { params } = getValidated<OrganizationMembershipParams>(context);
    const membership = await organizationService.deleteMember(
      params.organizationId,
      params.userId,
    );
    return context.json({ membership }, StatusCodes.OK);
  },
);
