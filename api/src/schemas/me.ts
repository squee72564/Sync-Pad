import { coreSchema } from '@syncpad/db';
import { z } from 'zod';
import { searchablePaginationSchema } from './shared.js';

export const meWorkspacesQuerySchema = searchablePaginationSchema;
export type MeWorkspacesQuery = z.infer<typeof meWorkspacesQuerySchema>;

export const meOrganizationsQuerySchema = searchablePaginationSchema;
export type MeOrganizationsQuery = z.infer<typeof meOrganizationsQuerySchema>;

export const meOrganizationInvitesQuerySchema =
  searchablePaginationSchema.extend({
    status: z
      .enum(coreSchema.organizationInviteStatusEnum.enumValues)
      .optional(),
  });
export type MeOrganizationInvitesQuery = z.infer<
  typeof meOrganizationInvitesQuerySchema
>;
