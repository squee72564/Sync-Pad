export type WorkspaceRole = 'manager' | 'editor' | 'commenter' | 'viewer';

export type Workspace = {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
};

export type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export type WorkspaceResponse = {
  workspace: Workspace;
};

export type OrganizationWorkspacesResponse = {
  workspaces: Workspace[];
};
