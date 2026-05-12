import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const bytea = customType<{
  data: Buffer;
  driverData: Buffer;
}>({
  dataType() {
    return 'bytea';
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return value;
  },
});

const colorColumn = () =>
  varchar('color', { length: 9 }).default('#808080FF').notNull();

export const organizationRoleEnum = pgEnum('organization_role', [
  'owner',
  'admin',
  'member',
  'guest',
]);

export const invitableOrganizationRoleEnum = [
  'admin',
  'member',
  'guest',
] as const;

export const organizationMembershipStatusEnum = pgEnum(
  'organization_membership_status',
  ['active', 'suspended'],
);

export const organizationInviteStatusEnum = pgEnum(
  'organization_invite_status',
  ['pending', 'accepted', 'declined', 'revoked', 'expired'],
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
  description: text('description').default('').notNull(),
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
    description: text('description').default('').notNull(),
    color: colorColumn(),
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
    check('workspace_color_hex_value', sql`${t.color} ~ '^#[0-9A-Fa-f]{8}$'`),
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

export const document = pgTable(
  'document',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    color: colorColumn(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    index('document_workspace_id_idx').on(t.workspaceId),
    index('document_workspace_id_deleted_at_idx').on(
      t.workspaceId,
      t.deletedAt,
    ),
    check('document_color_hex_value', sql`${t.color} ~ '^#[0-9A-Fa-f]{8}$'`),
  ],
);

export const documentState = pgTable('document_state', {
  documentId: text('document_id')
    .primaryKey()
    .references(() => document.id, { onDelete: 'cascade' }),
  yjsState: bytea('yjs_state').default(sql`decode('0000', 'hex')`).notNull(),
  persistedAt: timestamp('persisted_at').defaultNow().notNull(),
});

export const organizationInvite = pgTable(
  'organization_invite',
  {
    id: text('organization_invite_id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    organizationRole: organizationRoleEnum('organization_role').notNull(),

    status: organizationInviteStatusEnum('status').default('pending').notNull(),
    invitedBy: text('invited_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    acceptedBy: text('accepted_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    declinedAt: timestamp('declined_at'),
    revokedAt: timestamp('revoked_at'),
    lastSentAt: timestamp('last_sent_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('organization_invite_token_hash_unique').on(t.tokenHash),
    uniqueIndex('organization_invite_pending_email_unique')
      .on(t.organizationId, t.email)
      .where(sql`${t.status} = 'pending'`),
    index('organization_invite_organization_id_idx').on(t.organizationId),
    index('organization_invite_email_idx').on(t.email),
    index('organization_invite_invited_by_idx').on(t.invitedBy),
    index('organization_invite_accepted_by_idx').on(t.acceptedBy),
    index('organization_invite_status_idx').on(t.status),
    check(
      'organization_invite_email_normalized',
      sql`${t.email} = lower(trim(${t.email}))`,
    ),
    check(
      'organization_invite_email_valid',
      sql`${t.email} ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`,
    ),
  ],
);
