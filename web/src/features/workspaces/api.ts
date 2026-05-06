import { apiGet, apiPost } from '#/lib/api/client';
import type {
  CreateWorkspaceInput,
  CreateWorkspaceResponse,
  OrganizationWorkspacesResponse,
  WorkspaceMembersDetailedResponse,
  WorkspaceResponse,
} from './types';

type CreateWorkspaceVariables = {
  input: CreateWorkspaceInput;
  organizationId: string;
};

type GetWorkspaceVariables = {
  organizationId: string;
  workspaceId: string;
};

export function getOrganizationWorkspaces(organizationId: string) {
  return apiGet<OrganizationWorkspacesResponse>(
    `/api/organizations/${organizationId}/workspaces`,
  );
}

export function getWorkspace({
  organizationId,
  workspaceId,
}: GetWorkspaceVariables) {
  return apiGet<WorkspaceResponse>(
    `/api/organizations/${organizationId}/workspaces/${workspaceId}`,
  );
}

export function getWorkspaceMembers({
  organizationId,
  workspaceId,
}: GetWorkspaceVariables) {
  return apiGet<WorkspaceMembersDetailedResponse>(
    `/api/organizations/${organizationId}/workspaces/${workspaceId}/members`,
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
