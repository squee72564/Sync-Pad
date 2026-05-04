import type { Organization, Workspace, WorkspaceRole } from '@syncpad/types';
import type { PickAndRenameStrict } from '#/lib/utils';

export type MeOrganization = Organization;

type OrgRenamed = PickAndRenameStrict<
  Organization,
  'name',
  { name: 'organizationName' }
>;

export type MeWorkspace = Workspace & {
  workspaceRole: WorkspaceRole;
} & OrgRenamed;

export type MeOrganizationsResponse = {
  organizations: MeOrganization[];
};

export type MeWorkspacesResponse = {
  workspaces: MeWorkspace[];
};
