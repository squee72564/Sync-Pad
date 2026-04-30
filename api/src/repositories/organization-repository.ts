import { and, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  type OrganizationMembershipStatus,
  type OrganizationRole,
  organization,
  organizationMembership,
} from '../db/schema/core.js';

type DatabaseExecutor = Pick<
  typeof db,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

export const organizationRepository = {
  findById(organizationId: string, database: DatabaseExecutor = db) {
    return database.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
  },

  findMembership(
    organizationId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    return database.query.organizationMembership.findFirst({
      where: and(
        eq(organizationMembership.organizationId, organizationId),
        eq(organizationMembership.userId, userId),
      ),
    });
  },

  listMemberships(organizationId: string, database: DatabaseExecutor = db) {
    return database.query.organizationMembership.findMany({
      where: eq(organizationMembership.organizationId, organizationId),
    });
  },

  async insertOrganization(
    values: {
      id: string;
      name: string;
    },
    database: DatabaseExecutor = db,
  ) {
    const [created] = await database
      .insert(organization)
      .values(values)
      .returning();
    return created;
  },

  async updateOrganization(
    organizationId: string,
    values: {
      name?: string;
    },
    database: DatabaseExecutor = db,
  ) {
    const [updated] = await database
      .update(organization)
      .set(values)
      .where(eq(organization.id, organizationId))
      .returning();
    return updated ?? null;
  },

  async insertMembership(
    values: {
      userId: string;
      organizationId: string;
      organizationRole: OrganizationRole;
      status: OrganizationMembershipStatus;
      invitedBy?: string | null;
      joinedAt?: Date | null;
    },
    database: DatabaseExecutor = db,
  ) {
    const [created] = await database
      .insert(organizationMembership)
      .values(values)
      .returning();
    return created;
  },

  async updateMembership(
    organizationId: string,
    userId: string,
    values: {
      organizationRole?: OrganizationRole;
      status?: OrganizationMembershipStatus;
      invitedBy?: string | null;
      joinedAt?: Date | null;
    },
    database: DatabaseExecutor = db,
  ) {
    const [updated] = await database
      .update(organizationMembership)
      .set(values)
      .where(
        and(
          eq(organizationMembership.organizationId, organizationId),
          eq(organizationMembership.userId, userId),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async deleteMembership(
    organizationId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    const [deleted] = await database
      .delete(organizationMembership)
      .where(
        and(
          eq(organizationMembership.organizationId, organizationId),
          eq(organizationMembership.userId, userId),
        ),
      )
      .returning();
    return deleted ?? null;
  },

  async listOrganizationsForUser(
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    return database
      .select({
        organization,
      })
      .from(organizationMembership)
      .innerJoin(
        organization,
        eq(organizationMembership.organizationId, organization.id),
      )
      .where(
        and(
          eq(organizationMembership.userId, userId),
          eq(organizationMembership.status, 'active'),
        ),
      )
      .then((rows) => rows.map((row) => row.organization));
  },
};
