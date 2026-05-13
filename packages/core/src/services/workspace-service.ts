import type {
  DbClient,
  Document,
  DocumentRepository,
  NewWorkspace,
  OrganizationRepository,
  SearchableCursorPaginationInput,
  WorkspaceMembership,
  WorkspaceRepository,
} from '@syncpad/db';
import { CoreError } from '@syncpad/errors';
import {
  type AccessGraphOperation,
  type AccessGraphSync,
  type PermissionChecker,
  type PermissionMapFor,
  type ResourceAccess,
  resources,
  subjects,
  toDocumentParentTuple,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
  type WorkspacePermission,
} from '@syncpad/permify';

import { syncOrThrow } from '../utils/index.js';

export type WorkspaceServiceDeps = {
  organizationRepo: OrganizationRepository;
  workspaceRepo: WorkspaceRepository;
  documentRepo: DocumentRepository;
  accessGraphSync: AccessGraphSync;
  permissionChecker: PermissionChecker;
  db: DbClient;
};

type WorkspaceMembershipCleanupRecord = WorkspaceMembership;
type DocumentCleanupRecord = Document;
type CreateWorkspaceInput = Pick<
  NewWorkspace,
  'name' | 'description' | 'color'
>;

export function createWorkspaceService(deps: WorkspaceServiceDeps) {
  const {
    organizationRepo,
    workspaceRepo,
    documentRepo,
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

  const deleteDocumentParentTuples = (
    documents: DocumentCleanupRecord[],
  ): AccessGraphOperation[] =>
    documents.map((document) => ({
      type: 'delete',
      tuples: toDocumentParentTuple(document),
    }));

  return {
    async getWorkspaceAccess({
      actorUserId,
      workspaceId,
      permissions,
    }: {
      actorUserId: string;
      workspaceId: string;
      permissions: WorkspacePermission[];
    }): Promise<ResourceAccess<'workspace'>> {
      const subject = subjects.user(actorUserId);
      const resource = resources.workspace(workspaceId);

      const results = await permissionChecker.bulkCheckPermission(
        permissions.map((permission) => ({
          subject,
          resource,
          permission,
        })),
      );

      const access: PermissionMapFor<'workspace'> = {
        read: false,
        manage: false,
        invite: false,
        write: false,
        comment: false,
        run_ai: false,
      };

      for (const result of results) {
        const permission = permissions[result.item_index];

        if (!permission) {
          continue;
        }

        access[permission] = result.result;
      }

      return {
        permissions: access,
      };
    },

    async findById(workspaceId: string) {
      return workspaceRepo.findById(workspaceId);
    },

    async findInOrganization(input: {
      organizationId: string;
      workspaceId: string;
    }) {
      const workspace = await workspaceRepo.findById(input.workspaceId);

      if (!workspace || workspace.organizationId !== input.organizationId) {
        return null;
      }

      return workspace;
    },

    async listReadableToUser(input: { actorUserId: string }) {
      return workspaceRepo.listReadableToUser(input.actorUserId);
    },

    async listReadableToUserPage(
      input: { actorUserId: string } & SearchableCursorPaginationInput,
    ) {
      return workspaceRepo.listReadableToUserPage({
        userId: input.actorUserId,
        q: input.q,
        pagination: input.pagination,
      });
    },

    async listMemberships(workspaceId: string) {
      return workspaceRepo.listMemberships(workspaceId);
    },

    async listMembershipsWithUserProfiles(workspaceId: string) {
      return workspaceRepo.listMembershipsWithUserProfiles(workspaceId);
    },

    async listByOrganizationReadableToUserPage(
      input: {
        actorUserId: string;
        organizationId: string;
      } & SearchableCursorPaginationInput,
    ) {
      const includeAll = await permissionChecker.checkPermission(
        subjects.user(input.actorUserId),
        resources.organization(input.organizationId),
        'manage',
      );

      return workspaceRepo.listByOrganizationReadableToUserPage({
        organizationId: input.organizationId,
        userId: input.actorUserId,
        options: { includeAll },
        pagination: input.pagination,
        q: input.q,
      });
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

    async updateWorkspace(input: {
      workspaceId: string;
      data: {
        name?: string;
        description?: string;
        color?: string;
      };
    }) {
      return workspaceRepo.updateWorkspace(input.workspaceId, input.data);
    },

    async deleteWorkspace(workspaceId: string) {
      return db.transaction(async (tx) => {
        const existing = await workspaceRepo.findById(workspaceId, tx);
        const existingDocuments = await documentRepo.listByWorkspace(
          workspaceId,
          { includeDeleted: true },
          tx,
        );
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
            ...deleteDocumentParentTuples(existingDocuments),
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

    async addMember(input: {
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

    async updateMember(input: {
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

    async deleteMember(workspaceId: string, userId: string) {
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
export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
