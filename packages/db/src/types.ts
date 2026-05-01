import type {
  InferEnum,
  InferInsertModel,
  InferSelectModel,
} from 'drizzle-orm';
import type * as coreScehma from './schema/core.js';

export type Organization = InferSelectModel<typeof coreScehma.organization>;
export type NewOrganization = InferInsertModel<typeof coreScehma.organization>;
export type OrganizationRole = InferEnum<
  typeof coreScehma.organizationRoleEnum
>;

export type Workspace = InferSelectModel<typeof coreScehma.workspace>;
export type NewWorkspace = InferInsertModel<typeof coreScehma.workspace>;
export type WorkspaceRole = InferEnum<typeof coreScehma.workspaceRoleEnum>;

export type OrganizationMembershipStatus = InferEnum<
  typeof coreScehma.organizationMembershipStatusEnum
>;
