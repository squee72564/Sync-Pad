import type {
  NewOrganization,
  NewWorkspace,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  User,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
} from './db.js';
import type { Jsonify } from './json.js';
import type { PickAndRenameStrict } from './utils.js';

export type UserDto = Jsonify<User>;
export type OrganizationDto = Jsonify<Organization>;
export type WorkspaceDto = Jsonify<Workspace>;
export type OrganizationMembershipDto = Jsonify<OrganizationMembership>;
export type WorkspaceMembershipDto = Jsonify<WorkspaceMembership>;

export type MeOrganizationDto = OrganizationDto;
export type MeWorkspaceDto = WorkspaceDto & {
  organizationName: OrganizationDto['name'];
  workspaceRole: WorkspaceRole;
};

export type CreateOrganizationInput = Pick<
  NewOrganization,
  'name' | 'description'
>;
export type CreateWorkspaceInput = Required<
  Pick<NewWorkspace, 'name' | 'description' | 'color'>
>;

export type OrganizationResponse = {
  organization: OrganizationDto;
};

export type OrganizationsResponse = {
  organizations: OrganizationDto[];
};

export type CreateOrganizationResponse = OrganizationResponse;

export type OrganizationMembershipsResponse = {
  memberships: OrganizationMembershipDto[];
};

export type WorkspaceResponse = {
  workspace: WorkspaceDto;
};

export type OrganizationWorkspacesResponse = {
  workspaces: WorkspaceDto[];
};

export type CreateWorkspaceResponse = WorkspaceResponse;

export type WorkspaceMembershipsResponse = {
  memberships: WorkspaceMembershipDto[];
};

export type MeOrganizationsResponse = {
  organizations: MeOrganizationDto[];
};

export type MeWorkspacesResponse = {
  workspaces: MeWorkspaceDto[];
};

export type { OrganizationRole, WorkspaceRole };

export type OrganizationMembersDetailedDto = Pick<
  OrganizationMembershipDto,
  'organizationId' | 'userId' | 'organizationRole' | 'status' | 'joinedAt'
> &
  PickAndRenameStrict<
    UserDto,
    'name' | 'email' | 'image',
    { name: 'userName'; email: 'userEmail'; image: 'userImage' }
  >;

export type OrganizationMembersDetailedResponse = {
  memberships: OrganizationMembersDetailedDto[];
};
