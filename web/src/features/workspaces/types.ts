export type WorkspaceRole = 'manager' | 'editor' | 'commenter' | 'viewer';

export type Workspace = {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationWorkspacesResponse = {
  workspaces: Workspace[];
};
