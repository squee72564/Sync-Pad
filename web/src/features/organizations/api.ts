import { apiGet, apiPost } from '#/lib/api/client';
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
  OrganizationsResponse,
} from './types';

export function getOrganizations() {
  return apiGet<OrganizationsResponse>('/api/organizations');
}

export function createOrganization(input: CreateOrganizationInput) {
  return apiPost<CreateOrganizationResponse, CreateOrganizationInput>(
    '/api/organizations',
    input,
  );
}
