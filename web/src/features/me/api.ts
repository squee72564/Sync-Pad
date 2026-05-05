import { apiGet } from '#/lib/api/client';
import type { MeUserResponse } from '../../../../packages/types/dist/api';
import type { MeOrganizationsResponse, MeWorkspacesResponse } from './types';

export function getMeUser() {
  return apiGet<MeUserResponse>('/api/me');
}

export function getMeOrganizations() {
  return apiGet<MeOrganizationsResponse>('/api/me/organizations');
}

export function getMeWorkspaces() {
  return apiGet<MeWorkspacesResponse>('/api/me/workspaces');
}
