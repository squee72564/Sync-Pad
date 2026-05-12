import { apiDelete, apiGet, apiPost } from '#/lib/api/client';
import type {
  AcceptOrganizationInviteResponse,
  CreateOrganizationInviteInput,
  CreateOrganizationInviteResponse,
  DeclineOrganizationInviteResponse,
  OrganizationInvitePreviewResponse,
  OrganizationInviteSearch,
  OrganizationInvitesResponse,
  ResendOrganizationInviteResponse,
  RevokeOrganizationInviteResponse,
} from './types';

type OrganizationInviteTokenVariables = {
  organizationId: string;
  token: string;
};

type CreateOrganizationInviteVariables = {
  input: CreateOrganizationInviteInput;
  organizationId: string;
};

type OrganizationInviteVariables = {
  invitationId: string;
  organizationId: string;
};

const toOrganizationInviteQueryString = (
  search: OrganizationInviteSearch = {},
) => {
  const params = new URLSearchParams();

  if (search.q) {
    params.set('q', search.q);
  }

  if (search.limit !== undefined) {
    params.set('limit', String(search.limit));
  }

  if (search.cursor) {
    params.set('cursor', search.cursor);
  }

  if (search.status) {
    params.set('status', search.status);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};

export function getOrganizationInvitePreview({
  organizationId,
  token,
}: OrganizationInviteTokenVariables) {
  return apiGet<OrganizationInvitePreviewResponse>(
    `/api/organizations/${organizationId}/invitations/token/${token}`,
  );
}

export function acceptOrganizationInvite({
  organizationId,
  token,
}: OrganizationInviteTokenVariables) {
  return apiPost<AcceptOrganizationInviteResponse, undefined>(
    `/api/organizations/${organizationId}/invitations/token/${token}/accept`,
    undefined,
  );
}

export function declineOrganizationInvite({
  organizationId,
  token,
}: OrganizationInviteTokenVariables) {
  return apiPost<DeclineOrganizationInviteResponse, undefined>(
    `/api/organizations/${organizationId}/invitations/token/${token}/decline`,
    undefined,
  );
}

export function getOrganizationInvites(
  organizationId: string,
  search: OrganizationInviteSearch,
) {
  return apiGet<OrganizationInvitesResponse>(
    `/api/organizations/${organizationId}/invitations${toOrganizationInviteQueryString(search)}`,
  );
}

export function createOrganizationInvite({
  input,
  organizationId,
}: CreateOrganizationInviteVariables) {
  return apiPost<
    CreateOrganizationInviteResponse,
    CreateOrganizationInviteInput
  >(`/api/organizations/${organizationId}/invitations`, input);
}

export function resendOrganizationInvite({
  invitationId,
  organizationId,
}: OrganizationInviteVariables) {
  return apiPost<ResendOrganizationInviteResponse, undefined>(
    `/api/organizations/${organizationId}/invitations/${invitationId}/resend`,
    undefined,
  );
}

export function revokeOrganizationInvite({
  invitationId,
  organizationId,
}: OrganizationInviteVariables) {
  return apiDelete<RevokeOrganizationInviteResponse>(
    `/api/organizations/${organizationId}/invitations/${invitationId}`,
  );
}
