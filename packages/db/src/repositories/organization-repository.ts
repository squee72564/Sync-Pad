import { and, eq } from 'drizzle-orm';
import { withDbError } from '../errors.js';
import type { DbClient } from '../index.js';
import { user } from '../schema/auth-schema.js';
import { organization, organizationMembership } from '../schema/core.js';

import type {
  OrganizationMembershipStatus,
  OrganizationRole,
} from '../types.js';

type DatabaseExecutor = Pick<
  DbClient,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

export function createOrganizationRepository(db: DbClient) {
  return {
    findById(organizationId: string, database: DatabaseExecutor = db) {
      return withDbError(
        { entity: 'organization', operation: 'findById' },
        () =>
          database.query.organization.findFirst({
            where: eq(organization.id, organizationId),
          }),
      );
    },

    findMembership(
      organizationId: string,
      userId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organizationMembership', operation: 'findMembership' },
        () =>
          database.query.organizationMembership.findFirst({
            where: and(
              eq(organizationMembership.organizationId, organizationId),
              eq(organizationMembership.userId, userId),
            ),
          }),
      );
    },

    listMemberships(organizationId: string, database: DatabaseExecutor = db) {
      return withDbError(
        { entity: 'organizationMembership', operation: 'listMemberships' },
        () =>
          database.query.organizationMembership.findMany({
            where: eq(organizationMembership.organizationId, organizationId),
          }),
      );
    },

    listMembershipsReadableToUser(
      organizationId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organizationMembership',
          operation: 'listMembershipsReadableToUser',
        },
        () =>
          database
            .select({
              userId: organizationMembership.userId,
              organizationId: organizationMembership.organizationId,
              organizationRole: organizationMembership.organizationRole,
              status: organizationMembership.status,
              joinedAt: organizationMembership.joinedAt,

              userName: user.name,
              userEmail: user.email,
              userImage: user.image,
            })
            .from(organizationMembership)
            .innerJoin(user, eq(organizationMembership.userId, user.id))
            .where(eq(organizationMembership.organizationId, organizationId)),
      );
    },

    async insertOrganization(
      values: {
        id: string;
        name: string;
        description: string | undefined;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'insertOrganization' },
        async () => {
          const [created] = await database
            .insert(organization)
            .values(values)
            .returning();
          return created;
        },
      );
    },

    async updateOrganization(
      organizationId: string,
      values: {
        name?: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'updateOrganization' },
        async () => {
          const [updated] = await database
            .update(organization)
            .set(values)
            .where(eq(organization.id, organizationId))
            .returning();
          return updated ?? null;
        },
      );
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
      return withDbError(
        { entity: 'organizationMembership', operation: 'insertMembership' },
        async () => {
          const [created] = await database
            .insert(organizationMembership)
            .values(values)
            .returning();
          return created;
        },
      );
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
      return withDbError(
        { entity: 'organizationMembership', operation: 'updateMembership' },
        async () => {
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
      );
    },

    async deleteMembership(
      organizationId: string,
      userId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organizationMembership', operation: 'deleteMembership' },
        async () => {
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
      );
    },

    async listOrganizationsForUser(
      userId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'listOrganizationsForUser' },
        () =>
          database
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
            .then((rows) => rows.map((row) => row.organization)),
      );
    },
  };
}

export type OrganizationRepository = ReturnType<
  typeof createOrganizationRepository
>;
