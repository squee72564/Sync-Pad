import { and, desc, eq, gte, ilike, lt, lte, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { withDbError } from '../errors.js';
import type { DbClient } from '../index.js';
import {
  createPageInfo,
  decodeUpdatedAtIdCursor,
  type SearchableCursorPaginationInput,
} from '../pagination.js';
import { user } from '../schema/auth-schema.js';
import {
  organization,
  organizationInvite,
  organizationMembership,
} from '../schema/core.js';

import type {
  NewOrganization,
  NewOrganizationMembership,
  OrganizationInvite,
  OrganizationInviteStatus,
  OrganizationRole,
  User,
} from '../types.js';

type DatabaseExecutor = Pick<
  DbClient,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

type InsertOrganizationValues = Pick<
  NewOrganization,
  'id' | 'name' | 'description'
>;
type UpdateOrganizationValues = Partial<
  Pick<NewOrganization, 'name' | 'description'>
>;
type InsertOrganizationMembershipValues = Pick<
  NewOrganizationMembership,
  'userId' | 'organizationId' | 'organizationRole' | 'status' | 'joinedAt'
>;
type UpdateOrganizationMembershipValues = Partial<
  Pick<NewOrganizationMembership, 'organizationRole' | 'status' | 'joinedAt'>
>;

const invitedByUser = alias(user, 'invited_by_user');

const getOrganizationInviteSearchFilter = (q: string | undefined) =>
  q ? ilike(organizationInvite.email, `%${q}%`) : undefined;

const organizationInviteDetailedSelect = {
  id: organizationInvite.id,
  organizationId: organizationInvite.organizationId,
  email: organizationInvite.email,
  tokenHash: organizationInvite.tokenHash,
  organizationRole: organizationInvite.organizationRole,
  status: organizationInvite.status,
  invitedBy: organizationInvite.invitedBy,
  acceptedBy: organizationInvite.acceptedBy,
  expiresAt: organizationInvite.expiresAt,
  acceptedAt: organizationInvite.acceptedAt,
  declinedAt: organizationInvite.declinedAt,
  revokedAt: organizationInvite.revokedAt,
  lastSentAt: organizationInvite.lastSentAt,
  createdAt: organizationInvite.createdAt,
  updatedAt: organizationInvite.updatedAt,
  organizationName: organization.name,
  invitedByEmail: invitedByUser.email,
};

const getOrganizationInviteCursorFilter = (cursor: string | undefined) => {
  const decodedCursor = decodeUpdatedAtIdCursor(cursor);

  return decodedCursor
    ? or(
        lt(organizationInvite.updatedAt, decodedCursor.updatedAt),
        and(
          eq(organizationInvite.updatedAt, decodedCursor.updatedAt),
          lt(organizationInvite.id, decodedCursor.id),
        ),
      )
    : undefined;
};

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

    findUserByEmail(
      email: string,
      database: DatabaseExecutor = db,
    ): Promise<User | undefined> {
      return withDbError({ entity: 'user', operation: 'findUserByEmail' }, () =>
        database.query.user.findFirst({
          where: eq(user.email, email.trim().toLowerCase()),
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

    async deleteOrganization(
      organizationId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'deleteOrganization' },
        async () => {
          const [deleted] = await database
            .delete(organization)
            .where(eq(organization.id, organizationId))
            .returning();
          return deleted ?? null;
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

    async createOrganizationInvitation(
      input: {
        id: string;
        email: string;
        expiresAt: Date;
        organizationId: string;
        organizationRole: OrganizationRole;
        tokenHash: string;
        invitedBy: string;
      },
      database: DatabaseExecutor = db,
    ) {
      const normalizedEmail = input.email.trim().toLowerCase();
      return withDbError(
        {
          entity: 'organization',
          operation: 'createOrganizationInvitation',
        },
        async () => {
          const now = new Date();
          await database
            .update(organizationInvite)
            .set({
              status: 'expired',
              updatedAt: now,
            })
            .where(
              and(
                eq(organizationInvite.organizationId, input.organizationId),
                eq(organizationInvite.email, normalizedEmail),
                eq(organizationInvite.status, 'pending'),
                lte(organizationInvite.expiresAt, now),
              ),
            );

          const row = await database
            .insert(organizationInvite)
            .values({ ...input, email: normalizedEmail })
            .returning();
          return row[0] ?? null;
        },
      );
    },

    async listOrganizationInvitesForOrganizationPage(
      input: {
        organizationId: string;
        status?: OrganizationInviteStatus | undefined;
      } & SearchableCursorPaginationInput,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'listOrganizationInvitesForOrganizationPage',
        },
        async () => {
          const limit = input.pagination.limit;
          const rows = await database
            .select()
            .from(organizationInvite)
            .where(
              and(
                eq(organizationInvite.organizationId, input.organizationId),
                input.status
                  ? eq(organizationInvite.status, input.status)
                  : undefined,
                getOrganizationInviteSearchFilter(input.q),
                getOrganizationInviteCursorFilter(input.pagination.cursor),
              ),
            )
            .orderBy(
              desc(organizationInvite.updatedAt),
              desc(organizationInvite.id),
            )
            .limit(limit + 1);

          const organizationInvites = rows.slice(0, limit);

          return {
            organizationInvites,
            pageInfo: createPageInfo({
              items: organizationInvites,
              hasNextPage: rows.length > limit,
              limit,
            }),
          };
        },
      );
    },

    async expirePendingOrganizationInvitationsForOrganization(
      input: { organizationId: string },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'expirePendingOrganizationInvitationsForOrganization',
        },
        async () => {
          const now = new Date();
          const rows = await database
            .update(organizationInvite)
            .set({
              status: 'expired',
              updatedAt: now,
            })
            .where(
              and(
                lte(organizationInvite.expiresAt, now),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return rows;
        },
      );
    },

    async listOrganizationInvitesForUserPage(
      input: {
        userEmail: string;
        status?: OrganizationInviteStatus | undefined;
      } & SearchableCursorPaginationInput,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'listOrganizationInvitesForUserPage',
        },
        async () => {
          const normalizedEmail = input.userEmail.trim().toLowerCase();
          const limit = input.pagination.limit;
          const rows = await database
            .select(organizationInviteDetailedSelect)
            .from(organizationInvite)
            .innerJoin(
              organization,
              eq(organizationInvite.organizationId, organization.id),
            )
            .leftJoin(
              invitedByUser,
              eq(organizationInvite.invitedBy, invitedByUser.id),
            )
            .where(
              and(
                eq(organizationInvite.email, normalizedEmail),
                input.status
                  ? eq(organizationInvite.status, input.status)
                  : undefined,
                getOrganizationInviteSearchFilter(input.q),
                getOrganizationInviteCursorFilter(input.pagination.cursor),
              ),
            )
            .orderBy(
              desc(organizationInvite.updatedAt),
              desc(organizationInvite.id),
            )
            .limit(limit + 1);

          const organizationInvites = rows.slice(0, limit);

          return {
            organizationInvites,
            pageInfo: createPageInfo({
              items: organizationInvites,
              hasNextPage: rows.length > limit,
              limit,
            }),
          };
        },
      );
    },

    async getOrganizationInvitationForUserById(
      input: {
        organizationInviteId: string;
        userEmail: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'getOrganizationInvitationForUserById',
        },
        async () => {
          const normalizedEmail = input.userEmail.trim().toLowerCase();
          const rows = await database
            .select(organizationInviteDetailedSelect)
            .from(organizationInvite)
            .innerJoin(
              organization,
              eq(organizationInvite.organizationId, organization.id),
            )
            .leftJoin(
              invitedByUser,
              eq(organizationInvite.invitedBy, invitedByUser.id),
            )
            .where(
              and(
                eq(organizationInvite.id, input.organizationInviteId),
                eq(organizationInvite.email, normalizedEmail),
              ),
            )
            .limit(1);

          return rows[0] ?? null;
        },
      );
    },

    async expirePendingOrganizationInvitationsForUser(
      input: { userEmail: string },
      database: DatabaseExecutor = db,
    ) {
      const normalizedEmail = input.userEmail.trim().toLowerCase();
      return withDbError(
        {
          entity: 'organization',
          operation: 'expirePendingOrganizationInvitationsForUser',
        },
        async () => {
          const now = new Date();
          const rows = await database
            .update(organizationInvite)
            .set({
              status: 'expired',
              updatedAt: now,
            })
            .where(
              and(
                lte(organizationInvite.expiresAt, now),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.email, normalizedEmail),
              ),
            )
            .returning();

          return rows;
        },
      );
    },

    async getOrganizationInvitationByToken(
      input: {
        organizationId: string;
        tokenHash: string;
      },
      database: DatabaseExecutor = db,
    ): Promise<OrganizationInvite | null> {
      return withDbError(
        {
          entity: 'organization',
          operation: 'getOrganizationInvitationByToken',
        },
        async () => {
          const row = await database
            .select()
            .from(organizationInvite)
            .where(
              and(
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .limit(1);

          return row[0] ?? null;
        },
      );
    },

    async getOrganizationInvitationById(
      input: {
        organizationId: string;
        organizationInviteId: string;
      },
      database: DatabaseExecutor = db,
    ): Promise<OrganizationInvite | null> {
      return withDbError(
        {
          entity: 'organization',
          operation: 'getOrganizationInvitationById',
        },
        async () => {
          const row = await database
            .select()
            .from(organizationInvite)
            .where(
              and(
                eq(organizationInvite.id, input.organizationInviteId),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .limit(1);

          return row[0] ?? null;
        },
      );
    },

    async markOrganizationInvitationSent(
      input: {
        tokenHash: string;
        organizationId: string;
        sentAt: Date;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'markOrganizationInvitationSent',
        },
        async () => {
          const row = await database
            .update(organizationInvite)
            .set({
              lastSentAt: input.sentAt,
              updatedAt: input.sentAt,
            })
            .where(
              and(
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return row[0] ?? null;
        },
      );
    },

    async rotateOrganizationInvitationToken(
      input: {
        organizationInviteId: string;
        organizationId: string;
        tokenHash: string;
        sentAt: Date;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'rotateOrganizationInvitationToken',
        },
        async () => {
          const row = await database
            .update(organizationInvite)
            .set({
              tokenHash: input.tokenHash,
              lastSentAt: input.sentAt,
              updatedAt: input.sentAt,
            })
            .where(
              and(
                gte(organizationInvite.expiresAt, input.sentAt),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.id, input.organizationInviteId),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return row[0] ?? null;
        },
      );
    },

    async rotateOrganizationInvitationTokenForOpen(
      input: {
        organizationInviteId: string;
        organizationId: string;
        tokenHash: string;
        rotatedAt: Date;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        {
          entity: 'organization',
          operation: 'rotateOrganizationInvitationTokenForOpen',
        },
        async () => {
          const row = await database
            .update(organizationInvite)
            .set({
              tokenHash: input.tokenHash,
              updatedAt: input.rotatedAt,
            })
            .where(
              and(
                gte(organizationInvite.expiresAt, input.rotatedAt),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.id, input.organizationInviteId),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return row[0] ?? null;
        },
      );
    },

    async acceptOrganizationInvitation(
      input: {
        tokenHash: string;
        actorUserId: string;
        organizationId: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'acceptOrganizationInvitation' },
        async () => {
          const now = new Date();

          const acceptedOrganizationInvite = await database
            .update(organizationInvite)
            .set({
              status: 'accepted',
              acceptedBy: input.actorUserId,
              acceptedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                gte(organizationInvite.expiresAt, now),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return acceptedOrganizationInvite[0] ?? null;
        },
      );
    },

    async declineOrganizationInvitation(
      input: {
        tokenHash: string;
        organizationId: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'declineOrganizationInvitation' },
        async () => {
          const now = new Date();

          const declinedOrganizationInvite = await database
            .update(organizationInvite)
            .set({
              status: 'declined',
              declinedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                gte(organizationInvite.expiresAt, now),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return declinedOrganizationInvite[0] ?? null;
        },
      );
    },

    async expireOrganizationInvitation(
      input: {
        tokenHash: string;
        organizationId: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'expireOrganizationInvitation' },
        async () => {
          const now = new Date();
          const row = await database
            .update(organizationInvite)
            .set({
              status: 'expired',
              updatedAt: now,
            })
            .where(
              and(
                lte(organizationInvite.expiresAt, now),
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return row[0] ?? null;
        },
      );
    },

    async revokeOrganizationInvitation(
      input: {
        tokenHash: string;
        organizationId: string;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'organization', operation: 'revokeOrganizationInvitation' },
        async () => {
          const now = new Date();
          const row = await database
            .update(organizationInvite)
            .set({
              status: 'revoked',
              revokedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(organizationInvite.status, 'pending'),
                eq(organizationInvite.tokenHash, input.tokenHash),
                eq(organizationInvite.organizationId, input.organizationId),
              ),
            )
            .returning();

          return row[0] ?? null;
        },
      );
    },
  };
}

export type OrganizationRepository = ReturnType<
  typeof createOrganizationRepository
>;
