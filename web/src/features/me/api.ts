import { apiGet, apiPost } from '#/lib/api/client';
import { toListQueryString } from '#/lib/api/list-query';
import type { MeUserResponse } from '../../../../packages/types/dist/api';
import type {
  MeInvitationsSearch,
  MeListSearch,
  MeOrganizationInviteLinkResponse,
  MeOrganizationInvitesResponse,
  MeOrganizationsResponse,
  MeWorkspacesResponse,
} from './types';

const toMeInvitationsQueryString = (search: MeInvitationsSearch = {}) => {
  const params = new URLSearchParams(toListQueryString(search));

  if (search.status) {
    params.set('status', search.status);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};

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

export function getMeInvitations(search?: MeInvitationsSearch) {
  return apiGet<MeOrganizationInvitesResponse>(
    `/api/me/invitations${toMeInvitationsQueryString(search)}`,
  );
}

export function createMeInvitationLink(invitationId: string) {
  return apiPost<MeOrganizationInviteLinkResponse, undefined>(
    `/api/me/invitations/${invitationId}/link`,
    undefined,
  );
}
