import { coreSchema } from '@syncpad/db';
import { z } from 'zod';
import { organizationParamsSchema } from './organization.js';
import { searchablePaginationSchema } from './shared.js';

export const organizationInviteParamsSchema = z.object({
  organizationId: z.string().min(1),
  token: z.string().min(1),
});
export type OrganizationInviteParams = z.infer<
  typeof organizationInviteParamsSchema
>;

export const organizationInviteQuerySchema = searchablePaginationSchema.extend({
  status: z.enum(coreSchema.organizationInviteStatusEnum.enumValues).optional(),
});
export type OrganizationInviteQuery = z.infer<
  typeof organizationInviteQuerySchema
>;

export const organizationInviteCreateUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  organizationRole: z.enum(coreSchema.invitableOrganizationRoleEnum),
});

export type OrganizationInviteCreateUser = z.infer<
  typeof organizationInviteCreateUserSchema
>;

export const organizationInviteIdParamsSchema = organizationParamsSchema.extend(
  z.object({
    invitationId: z.string().min(1),
  }).shape,
);
export type OrganizationInviteIdParams = z.infer<
  typeof organizationInviteIdParamsSchema
>;
