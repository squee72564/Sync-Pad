import { z } from 'zod';

import { workspaceRoleEnum } from '../db/schema/core.js';

export const organizationWorkspaceParamsSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type OrganizationWorkspaceParams = z.infer<
  typeof organizationWorkspaceParamsSchema
>;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const organizationWorkspaceMembershipParamsSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
});
export type OrganizationWorkspaceMembershipParams = z.infer<
  typeof organizationWorkspaceMembershipParamsSchema
>;

export const addWorkspaceMemberSchema = z.object({
  userId: z.string().min(1),
  workspaceRole: z.enum(workspaceRoleEnum.enumValues),
});
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;

export const updateWorkspaceMemberSchema = z
  .object({
    workspaceRole: z.enum(workspaceRoleEnum.enumValues),
  })
  .partial()
  .refine((value) => value.workspaceRole !== undefined, {
    message: 'At least one membership field must be provided.',
    path: [],
  });
export type UpdateWorkspaceMemberInput = z.infer<
  typeof updateWorkspaceMemberSchema
>;
