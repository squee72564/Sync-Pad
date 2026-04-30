import { apiGet } from '#/lib/api/client';
import type { OrganizationWorkspacesResponse } from './types';

export function getOrganizationWorkspaces(organizationId: string) {
  return apiGet<OrganizationWorkspacesResponse>(
    `/api/organizations/${organizationId}/workspaces`,
  );
}
