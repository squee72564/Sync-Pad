import { z } from 'zod';

export const meWorkspacesQuerySchema = z.object({}).strict();
export type MeWorkspacesQuery = z.infer<typeof meWorkspacesQuerySchema>;

export const meOrganizationsQuerySchema = z.object({}).strict();
export type MeOrganizationsQuery = z.infer<typeof meOrganizationsQuerySchema>;
