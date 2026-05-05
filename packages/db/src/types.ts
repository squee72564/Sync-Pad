import type {
  InferEnum,
  InferInsertModel,
  InferSelectModel,
} from 'drizzle-orm';
import type * as authSchema from './schema/auth-schema.js';
import type * as coreSchema from './schema/core.js';

export type User = InferSelectModel<typeof authSchema.user>;

export type Organization = InferSelectModel<typeof coreSchema.organization>;
export type NewOrganization = InferInsertModel<typeof coreSchema.organization>;
export type OrganizationRole = InferEnum<
  typeof coreSchema.organizationRoleEnum
>;
export type OrganizationMembership = InferSelectModel<
  typeof coreSchema.organizationMembership
>;
export type NewOrganizationMembership = InferInsertModel<
  typeof coreSchema.organizationMembership
>;
export type OrganizationMembershipStatus = InferEnum<
  typeof coreSchema.organizationMembershipStatusEnum
>;

export type Workspace = InferSelectModel<typeof coreSchema.workspace>;
export type NewWorkspace = InferInsertModel<typeof coreSchema.workspace>;
export type WorkspaceMembership = InferSelectModel<
  typeof coreSchema.workspaceMembership
>;
export type NewWorkspaceMembership = InferInsertModel<
  typeof coreSchema.workspaceMembership
>;
export type WorkspaceRole = InferEnum<typeof coreSchema.workspaceRoleEnum>;

export type Document = InferSelectModel<typeof coreSchema.document>;
export type NewDocument = InferInsertModel<typeof coreSchema.document>;
export type DocumentState = InferSelectModel<typeof coreSchema.documentState>;
export type NewDocumentState = InferInsertModel<
  typeof coreSchema.documentState
>;
