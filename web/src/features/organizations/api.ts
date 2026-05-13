import { apiDelete, apiGet, apiPatch, apiPost } from '#/lib/api/client';
import type {
  CreateOrganizationInput,
  CreateOrganizationResponse,
  DeleteOrganizationResponse,
  OrganizationAccessDto,
  OrganizationMembersDetailedResponse,
  OrganizationResponse,
  OrganizationsResponse,
  UpdateOrganizationInput,
  UpdateOrganizationResponse,
} from './types';

type UpdateOrganizationVariables = {
  input: UpdateOrganizationInput;
  organizationId: string;
};

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

export function updateOrganization({
  input,
  organizationId,
}: UpdateOrganizationVariables) {
  return apiPatch<UpdateOrganizationResponse, UpdateOrganizationInput>(
    `/api/organizations/${organizationId}`,
    input,
  );
}

export function deleteOrganization(organizationId: string) {
  return apiDelete<DeleteOrganizationResponse>(
    `/api/organizations/${organizationId}`,
  );
}

export function getOrganizationMembers(organizationId: string) {
  return apiGet<OrganizationMembersDetailedResponse>(
    `/api/organizations/${organizationId}/members`,
  );
}

export async function getOrganizationAccessPermissions(organizationId: string) {
  const { access } = await apiGet<{ access: OrganizationAccessDto }>(
    `/api/organizations/${organizationId}/access`,
  );

  return access;
}
