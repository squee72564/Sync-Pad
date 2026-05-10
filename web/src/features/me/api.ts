import { apiGet } from '#/lib/api/client';
import { toListQueryString } from '#/lib/api/list-query';
import type { MeUserResponse } from '../../../../packages/types/dist/api';
import type {
  MeListSearch,
  MeOrganizationsResponse,
  MeWorkspacesResponse,
} from './types';

export function getMeUser() {
  return apiGet<MeUserResponse>('/api/me');
}

export function getMeOrganizations(search?: MeListSearch) {
  return apiGet<MeOrganizationsResponse>(
    `/api/me/organizations${toListQueryString(search)}`,
  );
}

export function getMeWorkspaces(search?: MeListSearch) {
  return apiGet<MeWorkspacesResponse>(
    `/api/me/workspaces${toListQueryString(search)}`,
  );
}
