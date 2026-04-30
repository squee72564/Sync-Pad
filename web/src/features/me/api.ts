import { apiGet } from '#/lib/api/client';
import type { MeOrganizationsResponse, MeWorkspacesResponse } from './types';

export function getMeOrganizations() {
  return apiGet<MeOrganizationsResponse>('/api/me/organizations');
}

export function getMeWorkspaces() {
  return apiGet<MeWorkspacesResponse>('/api/me/workspaces');
}
