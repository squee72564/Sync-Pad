import type { InferSelectModel } from 'drizzle-orm';

import type {
  organization,
  organizationMembership,
  workspace,
  workspaceMembership,
} from '../db/schema/core.js';

export type OrganizationRecord = InferSelectModel<typeof organization>;
export type OrganizationMembershipRecord = InferSelectModel<
  typeof organizationMembership
>;
export type WorkspaceRecord = InferSelectModel<typeof workspace>;
export type WorkspaceMembershipRecord = InferSelectModel<
  typeof workspaceMembership
>;

import type { Session, User } from 'better-auth';

export type AuthSessionInfo = Session;
export type AuthUser = User;

export type AuthSession = {
  session: AuthSessionInfo;
  user: AuthUser;
};

export type ValidatedRequestData = {
  params?: unknown;
  query?: unknown;
  json?: unknown;
};
