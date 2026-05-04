import {
  authSchema,
  coreSchema,
  type OrganizationMembershipStatus,
  type OrganizationRole,
  type WorkspaceRole,
} from '@syncpad/db';
import { and, eq, sql } from 'drizzle-orm';
import { getIntegrationDeps } from './integration-deps.js';

const FIXED_DATE = new Date('2024-01-02T03:04:05.000Z');
const db = getIntegrationDeps().db;

export const fixtureDate = FIXED_DATE;

export const resetDatabase = async () => {
  await db.execute(sql`
    TRUNCATE TABLE
      workspace_membership,
      workspace,
      organization_membership,
      organization,
      "user"
    RESTART IDENTITY CASCADE
  `);
};

export const seedUser = async (input: {
  id: string;
  email?: string;
  name?: string;
}) => {
  await db.insert(authSchema.user).values({
    id: input.id,
    email: input.email ?? `${input.id}@example.com`,
    emailVerified: true,
    name: input.name ?? input.id,
    image: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

  return db.query.user.findFirst({
    where: eq(authSchema.user.id, input.id),
  });
};

export const seedOrganization = async (input: {
  id: string;
  name?: string;
}) => {
  await db.insert(coreSchema.organization).values({
    id: input.id,
    name: input.name ?? input.id,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

  return db.query.organization.findFirst({
    where: eq(coreSchema.organization.id, input.id),
  });
};

export const seedOrganizationMembership = async (input: {
  userId: string;
  organizationId: string;
  organizationRole?: OrganizationRole;
  status?: OrganizationMembershipStatus;
  invitedBy?: string | null;
  joinedAt?: Date | null;
}) => {
  await db.insert(coreSchema.organizationMembership).values({
    userId: input.userId,
    organizationId: input.organizationId,
    organizationRole: input.organizationRole ?? 'member',
    status: input.status ?? 'active',
    invitedBy: input.invitedBy ?? input.userId,
    joinedAt:
      input.joinedAt === undefined
        ? input.status === 'invited'
          ? null
          : FIXED_DATE
        : input.joinedAt,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

  return db.query.organizationMembership.findFirst({
    where: and(
      eq(coreSchema.organizationMembership.userId, input.userId),
      eq(
        coreSchema.organizationMembership.organizationId,
        input.organizationId,
      ),
    ),
  });
};

export const seedWorkspace = async (input: {
  id: string;
  organizationId: string;
  name?: string;
}) => {
  await db.insert(coreSchema.workspace).values({
    id: input.id,
    organizationId: input.organizationId,
    name: input.name ?? input.id,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

  return db.query.workspace.findFirst({
    where: eq(coreSchema.workspace.id, input.id),
  });
};

export const seedWorkspaceMembership = async (input: {
  userId: string;
  workspaceId: string;
  organizationId: string;
  workspaceRole?: WorkspaceRole;
}) => {
  await db.insert(coreSchema.workspaceMembership).values({
    userId: input.userId,
    workspaceId: input.workspaceId,
    organizationId: input.organizationId,
    workspaceRole: input.workspaceRole ?? 'viewer',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

  return db.query.workspaceMembership.findFirst({
    where: and(
      eq(coreSchema.workspaceMembership.userId, input.userId),
      eq(coreSchema.workspaceMembership.workspaceId, input.workspaceId),
    ),
  });
};
