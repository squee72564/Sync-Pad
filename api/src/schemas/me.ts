import type { z } from 'zod';
import { searchablePaginationSchema } from './shared.js';

export const meWorkspacesQuerySchema = searchablePaginationSchema;
export type MeWorkspacesQuery = z.infer<typeof meWorkspacesQuerySchema>;

export const meOrganizationsQuerySchema = searchablePaginationSchema;
export type MeOrganizationsQuery = z.infer<typeof meOrganizationsQuerySchema>;
