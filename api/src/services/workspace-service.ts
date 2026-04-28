import { StatusCodes } from 'http-status-codes';

import { checkPermission } from '../authz/permify-client.js';
import { resources } from '../authz/permissions.js';
import {
  type AccessGraphOperation,
  type AccessGraphSync,
  permifyAccessGraphSync,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
} from '../authz/tuple-sync.js';
import { db } from '../db/client.js';
import { AppError } from '../lib/error.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';
import type { WorkspaceMembershipRecord } from '../types/api.js';

type WorkspaceRepository = typeof workspaceRepository;
type OrganizationRepository = typeof organizationRepository;
type WorkspaceMembershipCleanupRecord = WorkspaceMembershipRecord;

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
      message: 'Failed to synchronize workspace access graph',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      userMessage: 'Authorization updates could not be completed.',
    });
  }
};

export const createWorkspaceService = (dependencies?: {
  accessGraphSync?: AccessGraphSync;
  organizationRepo?: OrganizationRepository;
  workspaceRepo?: WorkspaceRepository;
}) => {
  const accessGraphSync =
    dependencies?.accessGraphSync ?? permifyAccessGraphSync;
  const organizationRepo =
    dependencies?.organizationRepo ?? organizationRepository;
  const workspaceRepo = dependencies?.workspaceRepo ?? workspaceRepository;

  const ensureActiveOrganizationMembership = async (
    organizationId: string,
    userId: string,
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  ) => {
    const membership = await organizationRepo.findMembership(
      organizationId,
      userId,
      tx,
    );

    if (!membership || membership.status !== 'active') {
      throw new AppError({
        code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
        expose: true,
        message: `No active organization membership for ${userId} in ${organizationId}`,
        status: StatusCodes.NOT_FOUND,
        userMessage: 'Organization membership not found.',
      });
    }

    return membership;
  };

  const deleteWorkspaceMembershipTuples = (
    memberships: WorkspaceMembershipCleanupRecord[],
  ): AccessGraphOperation[] =>
    memberships.map((membership) => ({
      type: 'delete',
      tuples: toWorkspaceMembershipTuple(membership),
    }));

  return {
    async listByOrganizationReadableToUser(input: {
      actorUserId: string;
      organizationId: string;
    }) {
      const includeAll = await checkPermission(
        input.actorUserId,
        resources.organization(input.organizationId),
        'manage',
      );

      return workspaceRepo.listByOrganizationReadableToUser(
        input.organizationId,
        input.actorUserId,
        { includeAll },
      );
    },

    async createWorkspace(input: {
      actorUserId: string;
      organizationId: string;
      input: {
        name: string;
      };
    }) {
      return db.transaction(async (tx) => {
        await ensureActiveOrganizationMembership(
          input.organizationId,
          input.actorUserId,
          tx,
        );

        const createdWorkspace = await workspaceRepo.insertWorkspace(
          {
            id: crypto.randomUUID(),
            organizationId: input.organizationId,
            name: input.input.name,
          },
          tx,
        );

        const ownerMembership = await workspaceRepo.insertMembership(
          {
            userId: input.actorUserId,
            workspaceId: createdWorkspace.id,
            organizationId: input.organizationId,
            workspaceRole: 'manager',
          },
          tx,
        );

        await syncOrThrow(accessGraphSync, [
          {
            type: 'write',
            tuples: toWorkspaceParentTuple(createdWorkspace),
          },
          {
            type: 'write',
            tuples: toWorkspaceMembershipTuple(ownerMembership),
          },
        ]);

        return createdWorkspace;
      });
    },

    updateWorkspace(input: {
      workspaceId: string;
      data: {
        name?: string;
      };
    }) {
      return workspaceRepo.updateWorkspace(input.workspaceId, input.data);
    },

    async deleteWorkspace(workspaceId: string) {
      return db.transaction(async (tx) => {
        const existing = await workspaceRepo.findById(workspaceId, tx);
        const existingMemberships = await workspaceRepo.listMemberships(
          workspaceId,
          tx,
        );
        const deleted = await workspaceRepo.deleteWorkspace(workspaceId, tx);

        if (existing && !deleted) {
          throw new AppError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            message: `Workspace ${workspaceId} disappeared during delete`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace not found.',
          });
        }

        if (existing) {
          await syncOrThrow(accessGraphSync, [
            {
              type: 'delete',
              tuples: toWorkspaceParentTuple(existing),
            },
            ...deleteWorkspaceMembershipTuples(existingMemberships),
          ]);
        }

        return deleted;
      });
    },

    addMember(input: {
      organizationId: string;
      workspaceId: string;
      userId: string;
      role: 'manager' | 'editor' | 'commenter' | 'viewer';
    }) {
      return db.transaction(async (tx) => {
        await ensureActiveOrganizationMembership(
          input.organizationId,
          input.userId,
          tx,
        );

        const membership = await workspaceRepo.insertMembership(
          {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            userId: input.userId,
            workspaceRole: input.role,
          },
          tx,
        );

        await syncOrThrow(accessGraphSync, {
          type: 'write',
          tuples: toWorkspaceMembershipTuple(membership),
        });

        return membership;
      });
    },

    updateMember(input: {
      workspaceId: string;
      userId: string;
      role: 'manager' | 'editor' | 'commenter' | 'viewer';
    }) {
      return db.transaction(async (tx) => {
        const existing = await workspaceRepo.findMembership(
          input.workspaceId,
          input.userId,
          tx,
        );

        if (!existing) {
          throw new AppError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            message: `Workspace membership for ${input.userId} in ${input.workspaceId} was not found`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace membership not found.',
          });
        }

        const updated = await workspaceRepo.updateMembership(
          input.workspaceId,
          input.userId,
          {
            workspaceRole: input.role,
          },
          tx,
        );

        if (!updated) {
          throw new AppError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            message: `Workspace membership for ${input.userId} in ${input.workspaceId} disappeared during update`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace membership not found.',
          });
        }

        await syncOrThrow(accessGraphSync, [
          {
            type: 'delete',
            tuples: toWorkspaceMembershipTuple(existing),
          },
          {
            type: 'write',
            tuples: toWorkspaceMembershipTuple(updated),
          },
        ]);

        return updated;
      });
    },

    deleteMember(workspaceId: string, userId: string) {
      return db.transaction(async (tx) => {
        const existing = await workspaceRepo.findMembership(
          workspaceId,
          userId,
          tx,
        );
        const deleted = await workspaceRepo.deleteMembership(
          workspaceId,
          userId,
          tx,
        );

        if (existing && !deleted) {
          throw new AppError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            message: `Workspace membership for ${userId} in ${workspaceId} disappeared during delete`,
            status: StatusCodes.NOT_FOUND,
            userMessage: 'Workspace membership not found.',
          });
        }

        if (existing) {
          await syncOrThrow(accessGraphSync, {
            type: 'delete',
            tuples: toWorkspaceMembershipTuple(existing),
          });
        }

        return deleted;
      });
    },
  };
};

export const workspaceService = createWorkspaceService();
