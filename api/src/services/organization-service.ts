import { StatusCodes } from 'http-status-codes';

import {
  type AccessGraphOperation,
  type AccessGraphSync,
  permifyAccessGraphSync,
  toOrganizationMembershipTuple,
} from '../authz/tuple-sync.js';
import { db } from '../db/client.js';
import { AppError } from '../lib/error.js';
import { organizationRepository } from '../repositories/organization-repository.js';

type OrganizationRepository = typeof organizationRepository;

type CreateOrganizationInput = {
  actorUserId: string;
  input: {
    name: string;
  };
};

type UpdateOrganizationInput = {
  organizationId: string;
  input: {
    name?: string;
  };
};

type UpsertOrganizationMembershipInput = {
  actorUserId: string;
  organizationId: string;
  userId: string;
  input: {
    organizationRole?: 'owner' | 'admin' | 'member' | 'guest';
    status?: 'invited' | 'active' | 'suspended';
  };
};

const syncOrThrow = async (
  accessGraphSync: AccessGraphSync,
  operation: AccessGraphOperation | AccessGraphOperation[],
) => {
  try {
    await accessGraphSync.apply(operation);
  } catch (error) {
    throw new AppError({
      cause: error,
      code: 'PERMIFY_SYNC_FAILED',
      message: 'Failed to synchronize organization access graph',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Authorization updates could not be completed.',
    });
  }
};

export const createOrganizationService = (dependencies?: {
  accessGraphSync?: AccessGraphSync;
  organizationRepo?: OrganizationRepository;
}) => {
  const accessGraphSync =
    dependencies?.accessGraphSync ?? permifyAccessGraphSync;
  const organizationRepo =
    dependencies?.organizationRepo ?? organizationRepository;

  return {
    listOrganizationsForUser(userId: string) {
      return organizationRepo.listOrganizationsForUser(userId);
    },

    createOrganization({ actorUserId, input }: CreateOrganizationInput) {
      return db.transaction(async (tx) => {
        const createdOrganization = await organizationRepo.insertOrganization(
          {
            id: crypto.randomUUID(),
            name: input.name,
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
          throw new AppError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            message: `Organization membership for ${userId} in ${organizationId} was not found`,
            status: StatusCodes.NOT_FOUND,
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
          throw new AppError({
            code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
            expose: true,
            message: `Organization membership for ${userId} in ${organizationId} disappeared during update`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Organization membership not found.',
          });
        }

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

        if (operations.length > 0) {
          await syncOrThrow(accessGraphSync, operations);
        }

        return updated;
      });
    },

    deleteMember(organizationId: string, userId: string) {
      return db.transaction(async (tx) => {
        const deleted = await organizationRepo.deleteMembership(
          organizationId,
          userId,
          tx,
        );

        if (deleted?.status === 'active') {
          await syncOrThrow(accessGraphSync, {
            type: 'delete',
            tuples: toOrganizationMembershipTuple(deleted),
          });
        }

        return deleted;
      });
    },
  };
};

export const organizationService = createOrganizationService();
