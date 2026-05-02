import { coreSchema } from '@syncpad/db';
import { z } from 'zod';

export const organizationParamsSchema = z.object({
  organizationId: z.string().min(1),
});
export type OrganizationParams = z.infer<typeof organizationParamsSchema>;

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const organizationMembershipParamsSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
});
export type OrganizationMembershipParams = z.infer<
  typeof organizationMembershipParamsSchema
>;

export const addOrganizationMemberSchema = z.object({
  userId: z.string().min(1),
  organizationRole: z.enum(coreSchema.organizationRoleEnum.enumValues),
  status: z
    .enum(coreSchema.organizationMembershipStatusEnum.enumValues)
    .default('invited'),
});
export type AddOrganizationMemberInput = z.infer<
  typeof addOrganizationMemberSchema
>;

export const updateOrganizationMemberSchema = z
  .object({
    organizationRole: z
      .enum(coreSchema.organizationRoleEnum.enumValues)
      .optional(),
    status: z
      .enum(coreSchema.organizationMembershipStatusEnum.enumValues)
      .optional(),
  })
  .refine(
    (value) =>
      value.organizationRole !== undefined || value.status !== undefined,
    {
      message: 'At least one membership field must be provided.',
      path: [],
    },
  );
export type UpdateOrganizationMemberInput = z.infer<
  typeof updateOrganizationMemberSchema
>;
