import { apiGet, apiPost } from '#/lib/api/client';
import type {
  CreateWorkspaceInput,
  CreateWorkspaceResponse,
  OrganizationWorkspacesResponse,
} from './types';

type CreateWorkspaceVariables = {
  input: CreateWorkspaceInput;
  organizationId: string;
};

export function getOrganizationWorkspaces(organizationId: string) {
  return apiGet<OrganizationWorkspacesResponse>(
    `/api/organizations/${organizationId}/workspaces`,
  );
}

export function createWorkspace({
  input,
  organizationId,
}: CreateWorkspaceVariables) {
  return apiPost<CreateWorkspaceResponse, CreateWorkspaceInput>(
    `/api/organizations/${organizationId}/workspaces`,
    input,
  );
}
