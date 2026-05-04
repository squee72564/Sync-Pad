import type {
  DbClient,
  NewWorkspace,
  OrganizationRepository,
  WorkspaceMembership,
  WorkspaceRepository,
} from '@syncpad/db';
import { CoreError } from '@syncpad/errors';
import {
  type AccessGraphOperation,
  type AccessGraphSync,
  type PermissionChecker,
  resources,
  subjects,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
} from '@syncpad/permify';

import { syncOrThrow } from '../utils/index.js';

export type WorkspaceServiceDeps = {
  organizationRepo: OrganizationRepository;
  workspaceRepo: WorkspaceRepository;
  accessGraphSync: AccessGraphSync;
  permissionChecker: PermissionChecker;
  db: DbClient;
};

type WorkspaceMembershipCleanupRecord = WorkspaceMembership;
type CreateWorkspaceInput = Pick<
  NewWorkspace,
  'name' | 'description' | 'color'
>;

export function createWorkspaceService(deps: WorkspaceServiceDeps) {
  const {
    organizationRepo,
    workspaceRepo,
    accessGraphSync,
    permissionChecker,
    db,
  } = deps;

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
      throw new CoreError({
        code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
        expose: true,
        kind: 'not_found',
        message: `No active organization membership for ${userId} in ${organizationId}`,
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
    listReadableToUser(input: { actorUserId: string }) {
      return workspaceRepo.listReadableToUser(input.actorUserId);
    },

    async listByOrganizationReadableToUser(input: {
      actorUserId: string;
      organizationId: string;
    }) {
      const includeAll = await permissionChecker.checkPermission(
        subjects.user(input.actorUserId),
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
      input: CreateWorkspaceInput;
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
            description: input.input.description,
            color: input.input.color,
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
          throw new CoreError({
            code: 'WORKSPACE_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Workspace ${workspaceId} disappeared during delete`,
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
          throw new CoreError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Workspace membership for ${input.userId} in ${input.workspaceId} was not found`,
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
          throw new CoreError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Workspace membership for ${input.userId} in ${input.workspaceId} disappeared during update`,
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
          throw new CoreError({
            code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
            expose: true,
            kind: 'not_found',
            message: `Workspace membership for ${userId} in ${workspaceId} disappeared during delete`,
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
}
export type CreateWorkspaceService = ReturnType<typeof createWorkspaceService>;
