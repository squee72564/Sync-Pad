import type {
  DbClient,
  NewOrganization,
  OrganizationMembershipStatus,
  OrganizationRepository,
  OrganizationRole,
  WorkspaceRepository,
} from '@syncpad/db';
import { CoreError } from '@syncpad/errors';
import {
  type AccessGraphOperation,
  type AccessGraphSync,
  toOrganizationMembershipTuple,
  toWorkspaceMembershipTuple,
} from '@syncpad/permify';

import { syncOrThrow } from '../utils/index.js';

export type OrganizationServiceDeps = {
  organizationRepo: OrganizationRepository;
  workspaceRepo: WorkspaceRepository;
  accessGraphSync: AccessGraphSync;
  db: DbClient;
};

type ActorId = { actorUserId: string };
type OrganizationId = { organizationId: string };

type CreateOrganizationInput = {
  input: Pick<NewOrganization, 'name' | 'description'>;
} & ActorId;

type UpdateOrganizationInput = {
  input: Partial<Pick<NewOrganization, 'name' | 'description'>>;
} & OrganizationId;

type UpsertOrganizationMembershipInput = {
  userId: string;
  input: {
    organizationRole?: OrganizationRole;
    status?: OrganizationMembershipStatus;
  };
} & ActorId &
  OrganizationId;

export function createOrganizationService(deps: OrganizationServiceDeps) {
  const { organizationRepo, workspaceRepo, accessGraphSync, db } = deps;

  const buildWorkspaceMembershipDeleteOperations = (
    memberships: Awaited<
      ReturnType<WorkspaceRepository['listMembershipsByOrganizationAndUser']>
    >,
  ): AccessGraphOperation[] =>
    memberships.map((membership) => ({
      type: 'delete',
      tuples: toWorkspaceMembershipTuple(membership),
    }));

  return {
    findById(organizationId: string) {
      return organizationRepo.findById(organizationId);
    },

    listOrganizationsForUser(userId: string) {
      return organizationRepo.listOrganizationsForUser(userId);
    },

    listMemberships(organizationId: string) {
      return organizationRepo.listMemberships(organizationId);
    },

    listMembershipsWithUserProfiles(organizationId: string) {
      return organizationRepo.listMembershipsWithUserProfiles(organizationId);
    },

    createOrganization({ actorUserId, input }: CreateOrganizationInput) {
      return db.transaction(async (tx) => {
        const createdOrganization = await organizationRepo.insertOrganization(
          {
            id: crypto.randomUUID(),
            name: input.name,
            description: input.description,
          },
          tx,
        );

        const ownerMembership = await organizationRepo.insertMembership(
          {
            userId: actorUserId,
            organizationId: createdOrganization.id,
            organizationRole: 'owner',
            status: 'active',
            invitedBy: actorUserId,
            joinedAt: new Date(),
          },
          tx,
        );

        await syncOrThrow(accessGraphSync, {
          type: 'write',
          tuples: toOrganizationMembershipTuple(ownerMembership),
        });

        return createdOrganization;
      });
    },

    updateOrganization({ organizationId, input }: UpdateOrganizationInput) {
      return organizationRepo.updateOrganization(organizationId, input);
    },

    addMember({
      actorUserId,
      organizationId,
      userId,
      input,
    }: UpsertOrganizationMembershipInput) {
      return db.transaction(async (tx) => {
        const membership = await organizationRepo.insertMembership(
          {
            userId,
            organizationId,
            organizationRole: input.organizationRole ?? 'member',
            status: input.status ?? 'invited',
            invitedBy: actorUserId,
            joinedAt: input.status === 'active' ? new Date() : null,
          },
          tx,
        );

        if (membership.status === 'active') {
          await syncOrThrow(accessGraphSync, {
            type: 'write',
            tuples: toOrganizationMembershipTuple(membership),
          });
        }

        return membership;
      });
    },

    updateMember({
      organizationId,
      userId,
      input,
    }: Omit<UpsertOrganizationMembershipInput, 'actorUserId'>) {
      return db.transaction(async (tx) => {
        const existing = await organizationRepo.findMembership(
          organizationId,
          userId,
          tx,
        );

        if (!existing) {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization membership for ${userId} in ${organizationId} was not found`,
            userMessage: 'Organization membership not found.',
          });
        }

        const updated = await organizationRepo.updateMembership(
          organizationId,
          userId,
          {
            organizationRole: input.organizationRole,
            status: input.status,
            joinedAt:
              input.status === 'active' && existing.joinedAt === null
                ? new Date()
                : existing.joinedAt,
          },
          tx,
        );

        if (!updated) {
          throw new CoreError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Organization membership for ${userId} in ${organizationId} disappeared during update`,
            userMessage: 'Organization membership not found.',
          });
        }

        const shouldRevokeWorkspaceMemberships = updated.status !== 'active';
        const existingWorkspaceMemberships = shouldRevokeWorkspaceMemberships
          ? await workspaceRepo.listMembershipsByOrganizationAndUser(
              organizationId,
              userId,
              tx,
            )
          : [];

        const operations: AccessGraphOperation[] = [];

        if (existing.status === 'active') {
          operations.push({
            type: 'delete',
            tuples: toOrganizationMembershipTuple(existing),
          });
        }

        if (updated.status === 'active') {
          operations.push({
            type: 'write',
            tuples: toOrganizationMembershipTuple(updated),
          });
        }

        if (shouldRevokeWorkspaceMemberships) {
          await workspaceRepo.deleteMembershipsByOrganizationAndUser(
            organizationId,
            userId,
            tx,
          );
          operations.push(
            ...buildWorkspaceMembershipDeleteOperations(
              existingWorkspaceMemberships,
            ),
          );
        }

        if (operations.length > 0) {
          await syncOrThrow(accessGraphSync, operations);
        }

        return updated;
      });
    },

    deleteMember(organizationId: string, userId: string) {
      return db.transaction(async (tx) => {
        const existingWorkspaceMemberships =
          await workspaceRepo.listMembershipsByOrganizationAndUser(
            organizationId,
            userId,
            tx,
          );
        const deleted = await organizationRepo.deleteMembership(
          organizationId,
          userId,
          tx,
        );

        const operations: AccessGraphOperation[] = [];

        if (deleted?.status === 'active') {
          operations.push({
            type: 'delete',
            tuples: toOrganizationMembershipTuple(deleted),
          });
        }

        operations.push(
          ...buildWorkspaceMembershipDeleteOperations(
            existingWorkspaceMemberships,
          ),
        );

        if (operations.length > 0) {
          await syncOrThrow(accessGraphSync, operations);
        }

        return deleted;
      });
    },
  };
}
export type OrganizationService = ReturnType<typeof createOrganizationService>;
