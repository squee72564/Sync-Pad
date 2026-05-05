import { z } from 'zod';
import { organizationWorkspaceParamsSchema } from './workspace.js';

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{8}$/, 'Color must be a valid #RRGGBBAA hex color.');

export const organizationWorkspaceDocumentParamsSchema =
  organizationWorkspaceParamsSchema.extend({
    documentId: z.string().min(1),
  });

export type OrganizationWorkspaceDocumentParams = z.infer<
  typeof organizationWorkspaceDocumentParamsSchema
>;

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  color: colorSchema,
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    color: colorSchema.optional(),
  })
  .refine((value) => value.title !== undefined || value.color !== undefined, {
    message: 'At least one document field must be provided.',
    path: [],
  });

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
