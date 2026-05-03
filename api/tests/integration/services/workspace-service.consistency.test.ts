import { coreSchema } from '@syncpad/db';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../../src/db/client.js';
import { createWorkspaceService } from '../../../src/services/workspace-service.js';
import {
  resetDatabase,
  seedOrganization,
  seedOrganizationMembership,
  seedUser,
  seedWorkspace,
  seedWorkspaceMembership,
} from '../../helpers/db-fixtures.js';

describe.sequential('workspace service consistency', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('rolls back workspace creation when Permify sync fails', async () => {
    await seedUser({ id: 'user_owner' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_owner',
      organizationId: 'org_1',
      organizationRole: 'owner',
      status: 'active',
    });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.createWorkspace({
        actorUserId: 'user_owner',
        organizationId: 'org_1',
        input: { name: 'Docs' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      kind: 'dependency_unavailable',
    });

    expect(
      await db.query.workspace.findFirst({
        where: and(
          eq(coreSchema.workspace.organizationId, 'org_1'),
          eq(coreSchema.workspace.name, 'Docs'),
        ),
      }),
    ).toBeUndefined();
    expect(await db.query.workspaceMembership.findMany()).toHaveLength(0);
  });

  it('rolls back workspace member inserts when Permify sync fails', async () => {
    await seedUser({ id: 'user_owner' });
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_owner',
      organizationId: 'org_1',
      organizationRole: 'owner',
      status: 'active',
    });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.addMember({
        organizationId: 'org_1',
        workspaceId: 'ws_1',
        userId: 'user_target',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(coreSchema.workspaceMembership.workspaceId, 'ws_1'),
          eq(coreSchema.workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
  });

  it('rolls back workspace member updates when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'viewer',
    });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.updateMember({
        workspaceId: 'ws_1',
        userId: 'user_target',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(coreSchema.workspaceMembership.workspaceId, 'ws_1'),
          eq(coreSchema.workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      workspaceRole: 'viewer',
    });
  });

  it('rolls back workspace member deletes when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'viewer',
    });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.deleteMember('ws_1', 'user_target'),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(coreSchema.workspaceMembership.workspaceId, 'ws_1'),
          eq(coreSchema.workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeDefined();
  });

  it('rolls back workspace deletes when Permify sync fails', async () => {
    await seedUser({ id: 'user_owner' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_owner',
      organizationId: 'org_1',
      organizationRole: 'owner',
      status: 'active',
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    await seedWorkspaceMembership({
      userId: 'user_owner',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'manager',
    });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(service.deleteWorkspace('ws_1')).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.workspace.findFirst({
        where: eq(coreSchema.workspace.id, 'ws_1'),
      }),
    ).toBeDefined();
  });

  it('rejects workspace creation when the actor lacks an active organization membership', async () => {
    await seedUser({ id: 'user_actor' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_actor',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'invited',
      joinedAt: null,
    });
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn(),
      },
    });

    await expect(
      service.createWorkspace({
        actorUserId: 'user_actor',
        organizationId: 'org_1',
        input: { name: 'Docs' },
      }),
    ).rejects.toMatchObject({
      code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
      kind: 'not_found',
    });

    expect(
      await db.query.workspace.findFirst({
        where: and(
          eq(coreSchema.workspace.organizationId, 'org_1'),
          eq(coreSchema.workspace.name, 'Docs'),
        ),
      }),
    ).toBeUndefined();
  });

  it('rejects workspace member inserts when the target lacks an active organization membership', async () => {
    await seedUser({ id: 'user_owner' });
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_owner',
      organizationId: 'org_1',
      organizationRole: 'owner',
      status: 'active',
    });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'invited',
      joinedAt: null,
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });

    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn(),
      },
    });

    await expect(
      service.addMember({
        organizationId: 'org_1',
        workspaceId: 'ws_1',
        userId: 'user_target',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
      kind: 'not_found',
    });

    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(coreSchema.workspaceMembership.workspaceId, 'ws_1'),
          eq(coreSchema.workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
  });

  it('throws membership-not-found when a preloaded workspace membership disappears during update', async () => {
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn(),
      },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: {
        findById: vi.fn(),
        findMembership: vi.fn().mockResolvedValue({
          userId: 'user_target',
          workspaceId: 'ws_1',
          organizationId: 'org_1',
          workspaceRole: 'viewer',
          createdAt: new Date('2024-01-02T03:04:05.000Z'),
          updatedAt: new Date('2024-01-02T03:04:05.000Z'),
        }),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        deleteWorkspace: vi.fn(),
        insertMembership: vi.fn(),
        deleteMembership: vi.fn(),
        listMemberships: vi.fn(),
        updateMembership: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(
      service.updateMember({
        workspaceId: 'ws_1',
        userId: 'user_target',
        role: 'editor',
      }),
    ).rejects.toMatchObject({
      code: 'WORKSPACE_MEMBERSHIP_NOT_FOUND',
      kind: 'not_found',
    });
  });

  it('throws workspace-not-found when a preloaded workspace disappears during delete', async () => {
    const service = createWorkspaceService({
      accessGraphSync: {
        apply: vi.fn(),
      },
      organizationRepo: {
        findMembership: vi.fn(),
      } as never,
      workspaceRepo: {
        findById: vi.fn().mockResolvedValue({
          id: 'ws_1',
          organizationId: 'org_1',
          name: 'Docs',
          createdAt: new Date('2024-01-02T03:04:05.000Z'),
          updatedAt: new Date('2024-01-02T03:04:05.000Z'),
        }),
        findMembership: vi.fn(),
        listByOrganizationReadableToUser: vi.fn(),
        insertWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
        insertMembership: vi.fn(),
        updateMembership: vi.fn(),
        listMemberships: vi.fn(),
        deleteMembership: vi.fn(),
        deleteWorkspace: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(service.deleteWorkspace('ws_1')).rejects.toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
      kind: 'not_found',
    });
  });
});
