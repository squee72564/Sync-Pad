import { apiGet, apiPost } from '#/lib/api/client';
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
  OrganizationMembersDetailedResponse,
  OrganizationResponse,
  OrganizationsResponse,
} from './types';

export function getOrganizations() {
  return apiGet<OrganizationsResponse>('/api/organizations');
}

export function getOrganization(organizationId: string) {
  return apiGet<OrganizationResponse>(`/api/organizations/${organizationId}`);
}

export function createOrganization(input: CreateOrganizationInput) {
  return apiPost<CreateOrganizationResponse, CreateOrganizationInput>(
    '/api/organizations',
    input,
  );
}

export function getOrganizationMembers(organizationId: string) {
  return apiGet<OrganizationMembersDetailedResponse>(
    `/api/organizations/${organizationId}/members`,
  );
}
