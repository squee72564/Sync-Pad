import type {
  DocumentPermission,
  OrganizationPermission,
  PermissionMap,
  WorkspacePermission,
} from './authz.js';
import type {
  Document,
  InvitableOrganizationRole,
  NewDocument,
  NewOrganization,
  NewWorkspace,
  Organization,
  OrganizationInvite,
  OrganizationInviteStatus,
  OrganizationMembership,
  OrganizationRole,
  User,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
} from './db.js';
import type { Jsonify } from './json.js';
import type { PickAndRenameStrict } from './utils.js';

export type {
  InvitableOrganizationRole,
  OrganizationInviteStatus,
  OrganizationRole,
  WorkspaceRole,
};
export type UserDto = Jsonify<User>;
export type OrganizationDto = Jsonify<Organization>;
export type WorkspaceDto = Jsonify<Workspace>;
export type DocumentDto = Jsonify<Document>;
export type OrganizationMembershipDto = Jsonify<OrganizationMembership>;
export type WorkspaceMembershipDto = Jsonify<WorkspaceMembership>;
export type OrganizationInviteDto = Jsonify<
  Omit<OrganizationInvite, 'tokenHash'>
> & {
  isExpired: boolean;
};

export type OrganizationInvitePreviewDto = Pick<
  OrganizationInviteDto,
  | 'id'
  | 'organizationId'
  | 'email'
  | 'organizationRole'
  | 'status'
  | 'expiresAt'
  | 'isExpired'
> & {
  organizationName: OrganizationDto['name'];
};

export type MeOrganizationDto = OrganizationDto;
export type MeWorkspaceDto = WorkspaceDto & {
  organizationName: OrganizationDto['name'];
  workspaceRole: WorkspaceRole;
};
export type MeOrganizationInviteDto = OrganizationInviteDto & {
  organizationName: OrganizationDto['name'];
  invitedByEmail: UserDto['email'] | null;
};

export type PageInfoDto = {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type SearchablePageParamsDto = {
  q?: string;
  limit?: number;
  cursor?: string;
};

export type OrganizationInviteQueryDto = SearchablePageParamsDto & {
  status?: OrganizationInviteStatus;
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
export type UpdateWorkspaceInput = Partial<
  Pick<NewWorkspace, 'name' | 'description' | 'color'>
>;
export type CreateDocumentInput = Required<
  Pick<NewDocument, 'title' | 'color'>
>;
export type UpdateDocumentInput = Partial<Pick<NewDocument, 'title' | 'color'>>;
export type CreateOrganizationInviteInput = {
  email: string;
  organizationRole: InvitableOrganizationRole;
};

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

export type OrganizationInvitePreviewResponse = {
  organizationInvitation: OrganizationInvitePreviewDto;
};

export type AcceptOrganizationInviteResponse = {
  membership: OrganizationMembershipDto;
  acceptedOrganizationInvitation: OrganizationInviteDto;
};

export type DeclineOrganizationInviteResponse = {
  declinedOrganizationInvitation: OrganizationInviteDto;
};

export type OrganizationInvitesResponse = {
  organizationInvites: OrganizationInviteDto[];
  pageInfo: PageInfoDto;
};

export type MeOrganizationInviteLinkResponse = {
  inviteUrl: string;
};

export type CreateOrganizationInviteResponse = {
  organizationInvite: OrganizationInviteDto;
};

export type ResendOrganizationInviteResponse = {
  resentOrganizationInvite: OrganizationInviteDto;
};

export type RevokeOrganizationInviteResponse = {
  revokedOrganizationInvite: OrganizationInviteDto;
};

export type WorkspaceResponse = {
  workspace: WorkspaceDto;
  access: WorkspaceAccessDto;
};

export type OrganizationWorkspacesResponse = {
  workspaces: WorkspaceDto[];
  pageInfo: PageInfoDto;
};

export type CreateWorkspaceResponse = WorkspaceResponse;

export type UpdateWorkspaceResponse = WorkspaceResponse;

export type DeleteWorkspaceResponse = {
  workspace: WorkspaceDto | null;
};

export type DocumentResponse = {
  document: DocumentDto;
};

export type OrganizationWorkspaceDocumentsResponse = {
  documents: DocumentDto[];
  access: DocumentAccessDto;
  pageInfo: PageInfoDto;
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
  pageInfo: PageInfoDto;
};

export type MeWorkspacesResponse = {
  workspaces: MeWorkspaceDto[];
  pageInfo: PageInfoDto;
};

export type MeOrganizationInvitesResponse = {
  organizationInvites: MeOrganizationInviteDto[];
  pageInfo: PageInfoDto;
};

export type OrganizationMembersDetailedResponse = {
  memberships: OrganizationMembersDetailedDto[];
};
export type WorkspaceMembersDetailedResponse = {
  memberships: WorkspaceMembershipDetailedDto[];
};
