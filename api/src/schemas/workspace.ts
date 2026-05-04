import { coreSchema } from '@syncpad/db';
import { z } from 'zod';

export const organizationWorkspaceParamsSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type OrganizationWorkspaceParams = z.infer<
  typeof organizationWorkspaceParamsSchema
>;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(512),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{8}$/, 'Color must be a valid #RRGGBBAA hex color.'),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(512).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{8}$/, 'Color must be a valid #RRGGBBAA hex color.')
    .optional(),
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
  workspaceRole: z.enum(coreSchema.workspaceRoleEnum.enumValues),
});
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;

export const updateWorkspaceMemberSchema = z
  .object({
    workspaceRole: z.enum(coreSchema.workspaceRoleEnum.enumValues),
  })
  .partial()
  .refine((value) => value.workspaceRole !== undefined, {
    message: 'At least one membership field must be provided.',
    path: [],
  });
export type UpdateWorkspaceMemberInput = z.infer<
  typeof updateWorkspaceMemberSchema
>;
