import { relations } from 'drizzle-orm';

import { account, session, user } from './auth-schema.js';
import {
  document,
  documentState,
  organization,
  organizationInvite,
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
  sentOrganizationInvites: many(organizationInvite, {
    relationName: 'organization_invite_inviter',
  }),
  acceptedOrganizationInvites: many(organizationInvite, {
    relationName: 'organization_invite_acceptor',
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
  invites: many(organizationInvite),
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
  }),
);

export const organizationInviteRelations = relations(
  organizationInvite,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationInvite.organizationId],
      references: [organization.id],
    }),
    inviter: one(user, {
      fields: [organizationInvite.invitedBy],
      references: [user.id],
      relationName: 'organization_invite_inviter',
    }),
    acceptor: one(user, {
      fields: [organizationInvite.acceptedBy],
      references: [user.id],
      relationName: 'organization_invite_acceptor',
    }),
  }),
);

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  organization: one(organization, {
    fields: [workspace.organizationId],
    references: [organization.id],
  }),
  documents: many(document),
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

export const documentRelations = relations(document, ({ one }) => ({
  workspace: one(workspace, {
    fields: [document.workspaceId],
    references: [workspace.id],
  }),
  state: one(documentState, {
    fields: [document.id],
    references: [documentState.documentId],
  }),
}));

export const documentStateRelations = relations(documentState, ({ one }) => ({
  document: one(document, {
    fields: [documentState.documentId],
    references: [document.id],
  }),
}));
