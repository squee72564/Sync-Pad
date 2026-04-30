export type MeOrganization = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type MeWorkspace = {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  workspaceRole: 'manager' | 'editor' | 'commenter' | 'viewer';
  createdAt: string;
  updatedAt: string;
};

export type MeOrganizationsResponse = {
  organizations: MeOrganization[];
};

export type MeWorkspacesResponse = {
  workspaces: MeWorkspace[];
};
