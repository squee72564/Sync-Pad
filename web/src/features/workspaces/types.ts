import type {
  Workspace as _Workspace,
  WorkspaceRole as _WorkspaceRole,
} from '@syncpad/types';

export type Workspace = _Workspace;
export type WorkspaceRole = _WorkspaceRole;
export type CreateWorkspaceInput = Omit<
  Workspace,
  'id' | 'createdAt' | 'updatedAt' | 'organizationId'
>;

export type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export type WorkspaceResponse = {
  workspace: Workspace;
};

export type OrganizationWorkspacesResponse = {
  workspaces: Workspace[];
};
