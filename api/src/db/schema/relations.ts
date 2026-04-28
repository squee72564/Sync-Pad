import { relations } from 'drizzle-orm';

import { account, session, user } from './auth-schema.js';
import {
  organization,
  organizationMembership,
  workspace,
  workspaceMembership,
} from './core.js';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizationMemberships: many(organizationMembership),
  workspaceMemberships: many(workspaceMembership),
  invitedOrganizationMemberships: many(organizationMembership, {
    relationName: 'organization_membership_inviter',
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  memberships: many(organizationMembership),
  workspaces: many(workspace),
  workspaceMemberships: many(workspaceMembership),
}));

export const organizationMembershipRelations = relations(
  organizationMembership,
  ({ one }) => ({
    user: one(user, {
      fields: [organizationMembership.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [organizationMembership.organizationId],
      references: [organization.id],
    }),
    inviter: one(user, {
      fields: [organizationMembership.invitedBy],
      references: [user.id],
      relationName: 'organization_membership_inviter',
    }),
  }),
);

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  organization: one(organization, {
    fields: [workspace.organizationId],
    references: [organization.id],
  }),
  memberships: many(workspaceMembership),
}));

export const workspaceMembershipRelations = relations(
  workspaceMembership,
  ({ one }) => ({
    user: one(user, {
      fields: [workspaceMembership.userId],
      references: [user.id],
    }),
    workspace: one(workspace, {
      fields: [workspaceMembership.workspaceId],
      references: [workspace.id],
    }),
    organization: one(organization, {
      fields: [workspaceMembership.organizationId],
      references: [organization.id],
    }),
  }),
);
