import { createWorkspaceService as createCoreWorkspaceService } from '@syncpad/core';
import type { PermissionChecker } from '@syncpad/permify';
import { describe, expect, it, vi } from 'vitest';

const fixtureDate = new Date('2024-01-02T03:04:05.000Z');
const db = {
  transaction: vi.fn(async (callback) => callback({})),
} as never;
const permissionChecker = {
  checkPermission: vi.fn(),
  writeTuples: vi.fn(),
} as unknown as PermissionChecker;

type WorkspaceServiceDeps = Parameters<typeof createCoreWorkspaceService>[0];

const createWorkspaceService = (
  deps: Omit<WorkspaceServiceDeps, 'db' | 'permissionChecker'> &
    Partial<Pick<WorkspaceServiceDeps, 'permissionChecker'>>,
) =>
  createCoreWorkspaceService({
    ...deps,
    db,
    permissionChecker: deps.permissionChecker ?? permissionChecker,
  });

describe('workspace service', () => {
  it('bubbles repository errors unchanged', async () => {
    const repoError = new Error('insert failed');
    const service = createWorkspaceService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        findMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'active',
          invitedBy: 'owner_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        findMembership: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        listMemberships: vi.fn(),
        listMembershipsByOrganizationAndUser: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
        insertMembership: vi.fn().mockRejectedValue(repoError),
      } as never,
    });

    await expect(
      service.addMember({
        organizationId: 'org_1',
        workspaceId: 'ws_1',
        userId: 'user_2',
        role: 'editor',
      }),
    ).rejects.toBe(repoError);
  });

  it('wraps workspace sync failures as PERMIFY_SYNC_FAILED', async () => {
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
      organizationRepo: {
        findMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'active',
          invitedBy: 'owner_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        findMembership: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        listMemberships: vi.fn(),
        listMembershipsByOrganizationAndUser: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
        insertMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          workspaceId: 'ws_1',
          organizationId: 'org_1',
          workspaceRole: 'editor',
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
    });

    await expect(
      service.addMember({
        organizationId: 'org_1',
        workspaceId: 'ws_1',
        userId: 'user_2',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      kind: 'dependency_unavailable',
    });
  });

  it('replaces old workspace membership tuples on role change', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const workspaceRepo = {
      findById: vi.fn(),
      findMembership: vi.fn().mockResolvedValue({
        userId: 'user_1',
        workspaceId: 'ws_1',
        organizationId: 'org_1',
        workspaceRole: 'viewer',
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
      }),
      listByOrganizationReadableToUser: vi.fn(),
      insertWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      insertMembership: vi.fn(),
      listMemberships: vi.fn(),
      listMembershipsByOrganizationAndUser: vi.fn(),
      updateMembership: vi.fn().mockResolvedValue({
        userId: 'user_1',
        workspaceId: 'ws_1',
        organizationId: 'org_1',
        workspaceRole: 'editor',
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
      }),
      deleteMembership: vi.fn(),
      deleteMembershipsByOrganizationAndUser: vi.fn(),
    };

    const service = createWorkspaceService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: workspaceRepo as never,
    });

    const membership = await service.updateMember({
      workspaceId: 'ws_1',
      userId: 'user_1',
      role: 'editor',
    });

    expect(membership.workspaceRole).toBe('editor');
    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'viewer',
        }),
      },
      {
        type: 'write',
        tuples: expect.objectContaining({
          relation: 'editor',
        }),
      },
    ]);
  });

  it('uses includeAll only when the actor can manage the organization', async () => {
    const workspaceRepo = {
      findById: vi.fn(),
      findMembership: vi.fn(),
      insertWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      insertMembership: vi.fn(),
      listMemberships: vi.fn(),
      listMembershipsByOrganizationAndUser: vi.fn(),
      updateMembership: vi.fn(),
      deleteMembership: vi.fn(),
      deleteMembershipsByOrganizationAndUser: vi.fn(),
      listByOrganizationReadableToUser: vi.fn().mockResolvedValue([]),
      listReadableToUser: vi.fn(),
    };
    const service = createWorkspaceService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: workspaceRepo as never,
    });

    vi.mocked(permissionChecker.checkPermission).mockResolvedValueOnce(true);
    await service.listByOrganizationReadableToUser({
      actorUserId: 'user_1',
      organizationId: 'org_1',
    });

    vi.mocked(permissionChecker.checkPermission).mockResolvedValueOnce(false);
    await service.listByOrganizationReadableToUser({
      actorUserId: 'user_1',
      organizationId: 'org_1',
    });

    expect(
      workspaceRepo.listByOrganizationReadableToUser,
    ).toHaveBeenNthCalledWith(1, 'org_1', 'user_1', { includeAll: true });
    expect(
      workspaceRepo.listByOrganizationReadableToUser,
    ).toHaveBeenNthCalledWith(2, 'org_1', 'user_1', { includeAll: false });
  });

  it('lists workspaces readable to the actor', async () => {
    const workspaceRepo = {
      findById: vi.fn(),
      findMembership: vi.fn(),
      insertWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      insertMembership: vi.fn(),
      listMemberships: vi.fn(),
      listMembershipsByOrganizationAndUser: vi.fn(),
      updateMembership: vi.fn(),
      deleteMembership: vi.fn(),
      deleteMembershipsByOrganizationAndUser: vi.fn(),
      listByOrganizationReadableToUser: vi.fn(),
      listReadableToUser: vi.fn().mockResolvedValue([
        {
          id: 'ws_1',
          name: 'Docs',
          organizationId: 'org_1',
          organizationName: 'Acme',
          workspaceRole: 'editor',
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        },
      ]),
    };
    const service = createWorkspaceService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: workspaceRepo as never,
    });

    await expect(
      service.listReadableToUser({ actorUserId: 'user_1' }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'ws_1',
        organizationId: 'org_1',
        organizationName: 'Acme',
        workspaceRole: 'editor',
      }),
    ]);
    expect(workspaceRepo.listReadableToUser).toHaveBeenCalledWith('user_1');
  });

  it('requires an active organization membership before adding a workspace member', async () => {
    const insertMembership = vi.fn();
    const syncApply = vi.fn();
    const service = createWorkspaceService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        findMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'invited',
          invitedBy: 'owner_1',
          joinedAt: null,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        findMembership: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        insertMembership,
        listMemberships: vi.fn(),
        listMembershipsByOrganizationAndUser: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await expect(
      service.addMember({
        organizationId: 'org_1',
        workspaceId: 'ws_1',
        userId: 'user_2',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
      kind: 'not_found',
    });

    expect(insertMembership).not.toHaveBeenCalled();
    expect(syncApply).not.toHaveBeenCalled();
  });

  it('deletes parent and workspace role tuples when deleting a workspace', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const service = createWorkspaceService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: {
        findById: vi.fn().mockResolvedValue({
          id: 'ws_1',
          organizationId: 'org_1',
          name: 'Docs',
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
        findMembership: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn().mockResolvedValue({
          id: 'ws_1',
          organizationId: 'org_1',
          name: 'Docs',
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
        insertMembership: vi.fn(),
        listMemberships: vi.fn().mockResolvedValue([
          {
            userId: 'user_1',
            workspaceId: 'ws_1',
            organizationId: 'org_1',
            workspaceRole: 'manager',
            createdAt: fixtureDate,
            updatedAt: fixtureDate,
          },
          {
            userId: 'user_2',
            workspaceId: 'ws_1',
            organizationId: 'org_1',
            workspaceRole: 'viewer',
            createdAt: fixtureDate,
            updatedAt: fixtureDate,
          },
        ]),
        listMembershipsByOrganizationAndUser: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await service.deleteWorkspace('ws_1');

    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'parent',
        }),
      },
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'manager',
        }),
      },
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'viewer',
        }),
      },
    ]);
  });
});
