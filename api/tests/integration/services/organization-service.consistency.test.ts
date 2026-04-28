import { and, eq } from 'drizzle-orm';
import { StatusCodes } from 'http-status-codes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '../../../src/db/client.js';
import {
  organization,
  organizationMembership,
  workspaceMembership,
} from '../../../src/db/schema/core.js';
import { createOrganizationService } from '../../../src/services/organization-service.js';
import {
  fixtureDate,
  resetDatabase,
  seedOrganization,
  seedOrganizationMembership,
  seedUser,
  seedWorkspace,
  seedWorkspaceMembership,
} from '../../helpers/db-fixtures.js';

describe.sequential('organization service consistency', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('rolls back organization creation when Permify sync fails', async () => {
    await seedUser({ id: 'user_owner' });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.createOrganization({
        actorUserId: 'user_owner',
        input: { name: 'Acme Rollback' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });

    expect(
      await db.query.organization.findFirst({
        where: eq(organization.name, 'Acme Rollback'),
      }),
    ).toBeUndefined();
    expect(await db.query.organizationMembership.findMany()).toHaveLength(0);
  });

  it('rolls back active member insert when Permify sync fails', async () => {
    await seedUser({ id: 'user_actor' });
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.addMember({
        actorUserId: 'user_actor',
        organizationId: 'org_1',
        userId: 'user_target',
        input: { organizationRole: 'member', status: 'active' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
  });

  it('persists invited member inserts without sync', async () => {
    const syncApply = vi.fn().mockResolvedValue(undefined);
    await seedUser({ id: 'user_actor' });
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    const service = createOrganizationService({
      accessGraphSync: { apply: syncApply },
    });

    const membership = await service.addMember({
      actorUserId: 'user_actor',
      organizationId: 'org_1',
      userId: 'user_target',
      input: { organizationRole: 'guest', status: 'invited' },
    });

    expect(membership.status).toBe('invited');
    expect(syncApply).not.toHaveBeenCalled();
    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      status: 'invited',
      organizationRole: 'guest',
      joinedAt: null,
    });
  });

  it('rolls back active-to-active membership updates when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
      joinedAt: fixtureDate,
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.updateMember({
        organizationId: 'org_1',
        userId: 'user_target',
        input: { organizationRole: 'admin', status: 'active' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      organizationRole: 'member',
      status: 'active',
      joinedAt: fixtureDate,
    });
  });

  it('rolls back invited-to-active membership updates when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'guest',
      status: 'invited',
      invitedBy: null,
      joinedAt: null,
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.updateMember({
        organizationId: 'org_1',
        userId: 'user_target',
        input: { organizationRole: 'member', status: 'active' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      organizationRole: 'guest',
      status: 'invited',
      joinedAt: null,
    });
  });

  it('rolls back active-to-suspended membership updates when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'admin',
      status: 'active',
      joinedAt: fixtureDate,
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'editor',
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.updateMember({
        organizationId: 'org_1',
        userId: 'user_target',
        input: { status: 'suspended' },
      }),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      organizationRole: 'admin',
      status: 'active',
    });
    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(workspaceMembership.workspaceId, 'ws_1'),
          eq(workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      workspaceRole: 'editor',
    });
  });

  it('rolls back membership deletes when Permify sync fails', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'viewer',
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockRejectedValue(new Error('permify down')),
      },
    });

    await expect(
      service.deleteMember('org_1', 'user_target'),
    ).rejects.toMatchObject({
      code: 'PERMIFY_SYNC_FAILED',
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toBeDefined();
    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(workspaceMembership.workspaceId, 'ws_1'),
          eq(workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeDefined();
  });

  it('removes dependent workspace memberships when an org membership is suspended', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
      joinedAt: fixtureDate,
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'commenter',
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockResolvedValue(undefined),
      },
    });

    await service.updateMember({
      organizationId: 'org_1',
      userId: 'user_target',
      input: { status: 'suspended' },
    });

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toMatchObject({
      status: 'suspended',
    });
    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(workspaceMembership.workspaceId, 'ws_1'),
          eq(workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
  });

  it('removes dependent workspace memberships when deleting an org membership', async () => {
    await seedUser({ id: 'user_target' });
    await seedOrganization({ id: 'org_1' });
    await seedOrganizationMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      organizationRole: 'member',
      status: 'active',
      joinedAt: fixtureDate,
    });
    await seedWorkspace({ id: 'ws_1', organizationId: 'org_1', name: 'Docs' });
    await seedWorkspaceMembership({
      userId: 'user_target',
      organizationId: 'org_1',
      workspaceId: 'ws_1',
      workspaceRole: 'viewer',
    });
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn().mockResolvedValue(undefined),
      },
    });

    await service.deleteMember('org_1', 'user_target');

    expect(
      await db.query.organizationMembership.findFirst({
        where: and(
          eq(organizationMembership.organizationId, 'org_1'),
          eq(organizationMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
    expect(
      await db.query.workspaceMembership.findFirst({
        where: and(
          eq(workspaceMembership.workspaceId, 'ws_1'),
          eq(workspaceMembership.userId, 'user_target'),
        ),
      }),
    ).toBeUndefined();
  });

  it('throws membership-not-found when a preloaded membership disappears during update', async () => {
    const service = createOrganizationService({
      accessGraphSync: {
        apply: vi.fn(),
      },
      organizationRepo: {
        listOrganizationsForUser: vi.fn(),
        insertOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        insertMembership: vi.fn(),
        deleteMembership: vi.fn(),
        listMemberships: vi.fn(),
        findMembership: vi.fn().mockResolvedValue({
          userId: 'user_target',
          organizationId: 'org_1',
          organizationRole: 'member',
          status: 'active',
          invitedBy: 'user_actor',
          joinedAt: fixtureDate,
          createdAt: fixtureDate,
          updatedAt: fixtureDate,
        }),
        updateMembership: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(
      service.updateMember({
        organizationId: 'org_1',
        userId: 'user_target',
        input: { organizationRole: 'admin' },
      }),
    ).rejects.toMatchObject({
      code: 'ORGANIZATION_MEMBERSHIP_NOT_FOUND',
      status: StatusCodes.NOT_FOUND,
    });
  });
});
