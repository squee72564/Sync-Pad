import { StatusCodes } from 'http-status-codes';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db/client.js', () => ({
  db: {
    transaction: vi.fn(async (callback) => callback({})),
  },
}));

vi.mock('../../../src/authz/permify-client.js', async () => {
  const actual = await vi.importActual('../../../src/authz/permify-client.js');
  return {
    ...actual,
    checkPermission: vi.fn(),
  };
});

import { checkPermission } from '../../../src/authz/permify-client.js';
import { createWorkspaceService } from '../../../src/services/workspace-service.js';

const fixtureDate = new Date('2024-01-02T03:04:05.000Z');

describe('workspace service', () => {
  it('bubbles repository errors unchanged', async () => {
    const repoError = new Error('insert failed');
    const service = createWorkspaceService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        listMemberships: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
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
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        listMemberships: vi.fn(),
        updateMembership: vi.fn(),
        deleteMembership: vi.fn(),
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
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('replaces old workspace membership tuples on role change', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    const workspaceRepo = {
      findById: vi.fn(),
      listByOrganizationReadableToUser: vi.fn(),
      insertWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      insertMembership: vi.fn(),
      listMemberships: vi.fn().mockResolvedValue([
        {
          userId: 'user_1',
          workspaceId: 'ws_1',
          organizationId: 'org_1',
          workspaceRole: 'viewer',
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        },
      ]),
      updateMembership: vi.fn().mockResolvedValue({
        userId: 'user_1',
        workspaceId: 'ws_1',
        organizationId: 'org_1',
        workspaceRole: 'editor',
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
      }),
      deleteMembership: vi.fn(),
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
      insertWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      insertMembership: vi.fn(),
      listMemberships: vi.fn(),
      updateMembership: vi.fn(),
      deleteMembership: vi.fn(),
      listByOrganizationReadableToUser: vi.fn().mockResolvedValue([]),
    };
    const service = createWorkspaceService({
      accessGraphSync: { apply: vi.fn() },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: workspaceRepo as never,
    });

    vi.mocked(checkPermission).mockResolvedValueOnce(true);
    await service.listByOrganizationReadableToUser({
      actorUserId: 'user_1',
      organizationId: 'org_1',
    });

    vi.mocked(checkPermission).mockResolvedValueOnce(false);
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
});
