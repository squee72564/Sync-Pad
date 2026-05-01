import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { user } from './auth-schema.js';

export const organizationRoleEnum = pgEnum('organization_role', [
  'owner',
  'admin',
  'member',
  'guest',
]);

export const organizationMembershipStatusEnum = pgEnum(
  'organization_membership_status',
  ['invited', 'active', 'suspended'],
);

export const workspaceRoleEnum = pgEnum('workspace_role', [
  'manager',
  'editor',
  'commenter',
  'viewer',
]);

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organizationMembership = pgTable(
  'organization_membership',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    organizationRole: organizationRoleEnum('organization_role').notNull(),

    status: organizationMembershipStatusEnum('status').notNull(),

    invitedBy: text('invited_by').references(() => user.id, {
      onDelete: 'set null',
    }),

    joinedAt: timestamp('joined_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.organizationId] }),
    index('organization_membership_user_id_idx').on(t.userId),
    index('organization_membership_organization_id_idx').on(t.organizationId),
  ],
);

export const workspace = pgTable(
  'workspace',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    unique('workspace_id_organization_id_unique').on(t.id, t.organizationId),
  ],
);

export const workspaceMembership = pgTable(
  'workspace_membership',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    workspaceRole: workspaceRoleEnum('workspace_role').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.workspaceId] }),
    foreignKey({
      columns: [t.userId, t.organizationId],
      foreignColumns: [
        organizationMembership.userId,
        organizationMembership.organizationId,
      ],
      name: 'workspace_membership_user_id_organization_id_org_membership_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.workspaceId, t.organizationId],
      foreignColumns: [workspace.id, workspace.organizationId],
      name: 'workspace_membership_workspace_id_organization_id_workspace_fk',
    }).onDelete('cascade'),
    index('workspace_membership_user_id_idx').on(t.userId),
    index('workspace_membership_workspace_id_idx').on(t.workspaceId),
    index('workspace_membership_organization_id_idx').on(t.organizationId),
  ],
);
