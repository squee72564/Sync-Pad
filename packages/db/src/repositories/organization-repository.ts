import { and, desc, eq, ilike, lt, or } from 'drizzle-orm';
import { withDbError } from '../errors.js';
import type { DbClient } from '../index.js';
import {
  createPageInfo,
  decodeUpdatedAtIdCursor,
  type SearchableCursorPaginationInput,
} from '../pagination.js';
import { user } from '../schema/auth-schema.js';
import { organization, organizationMembership } from '../schema/core.js';

import type { NewOrganization, NewOrganizationMembership } from '../types.js';

type DatabaseExecutor = Pick<
  DbClient,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

type InsertOrganizationValues = Pick<
  NewOrganization,
  'id' | 'name' | 'description'
>;
type UpdateOrganizationValues = Partial<Pick<NewOrganization, 'name'>>;
type InsertOrganizationMembershipValues = Pick<
  NewOrganizationMembership,
  | 'userId'
  | 'organizationId'
  | 'organizationRole'
  | 'status'
  | 'invitedBy'
  | 'joinedAt'
>;
type UpdateOrganizationMembershipValues = Partial<
  Pick<
    NewOrganizationMembership,
    'organizationRole' | 'status' | 'invitedBy' | 'joinedAt'
  >
>;

const getOrganizationSearchFilter = (q: string | undefined) =>
  q
    ? or(
        ilike(organization.name, `%${q}%`),
        ilike(organization.description, `%${q}%`),
      )
    : undefined;

const getOrganizationCursorFilter = (cursor: string | undefined) => {
  const decodedCursor = decodeUpdatedAtIdCursor(cursor);

  return decodedCursor
    ? or(
        lt(organization.updatedAt, decodedCursor.updatedAt),
        and(
          eq(organization.updatedAt, decodedCursor.updatedAt),
          lt(organization.id, decodedCursor.id),
        ),
      )
    : undefined;
};

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

    listMembershipsWithUserProfiles(
      organizationId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organizationMembership',
          operation: 'listMembershipsWithUserProfiles',
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
      values: InsertOrganizationValues,
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
      values: UpdateOrganizationValues,
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
      values: InsertOrganizationMembershipValues,
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
      values: UpdateOrganizationMembershipValues,
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

    async listOrganizationsForUserPage(
      input: { userId: string } & SearchableCursorPaginationInput,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'listOrganizationsForUserPage' },
        async () => {
          const limit = input.pagination.limit;
          const rows = await database
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
                eq(organizationMembership.userId, input.userId),
                eq(organizationMembership.status, 'active'),
                getOrganizationSearchFilter(input.q),
                getOrganizationCursorFilter(input.pagination.cursor),
              ),
            )
            .orderBy(desc(organization.updatedAt), desc(organization.id))
            .limit(limit + 1);

          const organizations = rows
            .slice(0, limit)
            .map((row) => row.organization);

          return {
            organizations,
            pageInfo: createPageInfo({
              items: organizations,
              hasNextPage: rows.length > limit,
              limit,
            }),
          };
        },
      );
    },
  };
}

export type OrganizationRepository = ReturnType<
  typeof createOrganizationRepository
>;
