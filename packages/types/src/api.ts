import type {
  DocumentPermission,
  OrganizationPermission,
  PermissionMap,
  WorkspacePermission,
} from './authz.js';
import type {
  Document,
  NewDocument,
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

export type { OrganizationRole, WorkspaceRole };
export type UserDto = Jsonify<User>;
export type OrganizationDto = Jsonify<Organization>;
export type WorkspaceDto = Jsonify<Workspace>;
export type DocumentDto = Jsonify<Document>;
export type OrganizationMembershipDto = Jsonify<OrganizationMembership>;
export type WorkspaceMembershipDto = Jsonify<WorkspaceMembership>;

export type MeOrganizationDto = OrganizationDto;
export type MeWorkspaceDto = WorkspaceDto & {
  organizationName: OrganizationDto['name'];
  workspaceRole: WorkspaceRole;
};

export type OrganizationAccessDto = {
  permissions: PermissionMap<OrganizationPermission>;
};

export type WorkspaceAccessDto = {
  permissions: PermissionMap<WorkspacePermission>;
};

export type DocumentAccessDto = {
  permissions: PermissionMap<DocumentPermission>;
};

type UserDetailRenamed = PickAndRenameStrict<
  UserDto,
  'name' | 'email' | 'image',
  { name: 'userName'; email: 'userEmail'; image: 'userImage' }
>;

export type OrganizationMembersDetailedDto = Pick<
  OrganizationMembershipDto,
  'organizationId' | 'userId' | 'organizationRole' | 'status' | 'joinedAt'
> &
  UserDetailRenamed;

export type WorkspaceMembershipDetailedDto = Pick<
  WorkspaceMembership,
  'organizationId' | 'workspaceId' | 'workspaceRole' | 'userId'
> &
  UserDetailRenamed;

export type CreateOrganizationInput = Pick<
  NewOrganization,
  'name' | 'description'
>;
export type CreateWorkspaceInput = Required<
  Pick<NewWorkspace, 'name' | 'description' | 'color'>
>;
export type CreateDocumentInput = Required<
  Pick<NewDocument, 'title' | 'color'>
>;
export type UpdateDocumentInput = Partial<Pick<NewDocument, 'title' | 'color'>>;

export type OrganizationResponse = {
  organization: OrganizationDto;
  access: OrganizationAccessDto;
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

export type DocumentResponse = {
  document: DocumentDto;
};

export type OrganizationWorkspaceDocumentsResponse = {
  documents: DocumentDto[];
};

export type CreateDocumentResponse = DocumentResponse;

export type WorkspaceMembershipsResponse = {
  memberships: WorkspaceMembershipDto[];
};

export type MeUserResponse = {
  user: UserDto;
};

export type MeOrganizationsResponse = {
  organizations: MeOrganizationDto[];
};

export type MeWorkspacesResponse = {
  workspaces: MeWorkspaceDto[];
};

export type OrganizationMembersDetailedResponse = {
  memberships: OrganizationMembersDetailedDto[];
};
export type WorkspaceMembersDetailedResponse = {
  memberships: WorkspaceMembershipDetailedDto[];
};
