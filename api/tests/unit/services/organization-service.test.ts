import { createOrganizationService as createCoreOrganizationService } from '@syncpad/core';
import { describe, expect, it, vi } from 'vitest';

const fixtureDate = new Date('2024-01-02T03:04:05.000Z');
const db = {
  transaction: vi.fn(async (callback) => callback({})),
} as never;

type OrganizationServiceDeps = Parameters<
  typeof createCoreOrganizationService
>[0];

const createOrganizationService = (deps: Omit<OrganizationServiceDeps, 'db'>) =>
  createCoreOrganizationService({
    ...deps,
    db,
  });

describe('organization service', () => {
  it('bubbles repository insert errors unchanged', async () => {
    const repoError = new Error('insert failed');
    const service = createOrganizationService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        findMembership: vi.fn(),
        listMemberships: vi.fn(),
        deleteMembership: vi.fn(),
        updateMembership: vi.fn(),
        insertMembership: vi.fn().mockRejectedValue(repoError),
      } as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await expect(
      service.addMember({
        actorUserId: 'user_1',
        organizationId: 'org_1',
        userId: 'user_2',
        input: { status: 'active' },
      }),
    ).rejects.toBe(repoError);
  });

  it('wraps sync failures as PERMIFY_SYNC_FAILED', async () => {
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        findMembership: vi.fn(),
        listMemberships: vi.fn(),
        deleteMembership: vi.fn(),
        updateMembership: vi.fn(),
        insertMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'active',
          invitedBy: 'user_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await expect(
      service.addMember({
        actorUserId: 'user_1',
        organizationId: 'org_1',
        userId: 'user_2',
        input: { status: 'active', organizationRole: 'member' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      kind: 'dependency_unavailable',
    });
  });

  it('syncs active organization memberships but skips invited memberships', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const organizationRepo = {
      listOrganizationsForUser: vi.fn(),
      insertOrganization: vi.fn(),
      updateOrganization: vi.fn(),
      findMembership: vi.fn(),
      listMemberships: vi.fn(),
      deleteMembership: vi.fn(),
      insertMembership: vi
        .fn()
        .mockResolvedValueOnce({
          userId: 'user_active',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'active',
          invitedBy: 'owner_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        })
        .mockResolvedValueOnce({
          userId: 'user_invited',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'invited',
          invitedBy: 'owner_1',
          joinedAt: null,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      updateMembership: vi.fn(),
    };

    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: organizationRepo as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await service.addMember({
      actorUserId: 'owner_1',
      organizationId: 'org_1',
      userId: 'user_active',
      input: {
        organizationRole: 'member',
        status: 'active',
      },
    });

    await service.addMember({
      actorUserId: 'owner_1',
      organizationId: 'org_1',
      userId: 'user_invited',
      input: {
        organizationRole: 'member',
        status: 'invited',
      },
    });

    expect(syncApply).toHaveBeenCalledTimes(1);
    expect(syncApply).toHaveBeenCalledWith({
      type: 'write',
      tuples: expect.objectContaining({
        relation: 'member',
      }),
    });
  });

  it('builds delete-then-write tuple sync operations for active membership role changes', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        insertMembership: vi.fn(),
        listMemberships: vi.fn(),
        deleteMembership: vi.fn(),
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
        updateMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'admin',
          status: 'active',
          invitedBy: 'owner_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn(),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await service.updateMember({
      organizationId: 'org_1',
      userId: 'user_2',
      input: {
        organizationRole: 'admin',
        status: 'active',
      },
    });

    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'member',
        }),
      },
      {
        type: 'write',
        tuples: expect.objectContaining({
          relation: 'admin',
        }),
      },
    ]);
  });

  it('only syncs deletes for active organization membership removals', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const deleteMembership = vi
      .fn()
      .mockResolvedValueOnce({
        userId: 'user_active',
        organizationId: 'org_1',
        organizationRole: 'member',
        status: 'active',
        invitedBy: 'owner_1',
        joinedAt: fixtureDate,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
      })
      .mockResolvedValueOnce({
        userId: 'user_invited',
        organizationId: 'org_1',
        organizationRole: 'member',
        status: 'invited',
        invitedBy: 'owner_1',
        joinedAt: null,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
      });
    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        insertMembership: vi.fn(),
        findMembership: vi.fn(),
        listMemberships: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership,
      } as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn().mockResolvedValue([]),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await service.deleteMember('org_1', 'user_active');
    await service.deleteMember('org_1', 'user_invited');

    expect(syncApply).toHaveBeenCalledTimes(1);
    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'member',
        }),
      },
    ]);
  });

  it('revokes workspace memberships when an org membership becomes non-active', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const deleteMembershipsByOrganizationAndUser = vi.fn();
    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        insertMembership: vi.fn(),
        listMemberships: vi.fn(),
        deleteMembership: vi.fn(),
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
        updateMembership: vi.fn().mockResolvedValue({
          userId: 'user_2',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'suspended',
          invitedBy: 'owner_1',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
      } as never,
      workspaceRepo: {
        listMembershipsByOrganizationAndUser: vi.fn().mockResolvedValue([
          {
            userId: 'user_2',
            workspaceId: 'ws_1',
            organizationId: 'org_1',
            workspaceRole: 'editor',
            createdAt: fixtureDate,
            updatedAt: fixtureDate,
          },
          {
            userId: 'user_2',
            workspaceId: 'ws_2',
            organizationId: 'org_1',
            workspaceRole: 'viewer',
            createdAt: fixtureDate,
            updatedAt: fixtureDate,
          },
        ]),
        deleteMembershipsByOrganizationAndUser,
      } as never,
    });

    await service.updateMember({
      organizationId: 'org_1',
      userId: 'user_2',
      input: {
        status: 'suspended',
      },
    });

    expect(deleteMembershipsByOrganizationAndUser).toHaveBeenCalledWith(
      'org_1',
      'user_2',
      expect.anything(),
    );
    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'member',
        }),
      },
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'editor',
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

  it('removes workspace tuples when deleting an org membership', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        insertMembership: vi.fn(),
        findMembership: vi.fn(),
        listMemberships: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn().mockResolvedValue({
          userId: 'user_active',
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
        listMembershipsByOrganizationAndUser: vi.fn().mockResolvedValue([
          {
            userId: 'user_active',
            workspaceId: 'ws_1',
            organizationId: 'org_1',
            workspaceRole: 'commenter',
            createdAt: fixtureDate,
            updatedAt: fixtureDate,
          },
        ]),
        deleteMembershipsByOrganizationAndUser: vi.fn(),
      } as never,
    });

    await service.deleteMember('org_1', 'user_active');

    expect(syncApply).toHaveBeenCalledWith([
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'member',
        }),
      },
      {
        type: 'delete',
        tuples: expect.objectContaining({
          relation: 'commenter',
        }),
      },
    ]);
  });
});
