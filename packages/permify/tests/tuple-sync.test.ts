import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PermissionChecker } from '../src/permissions.js';
import {
  createPermifyAccessGraphSync,
  PERMIFY_RELATIONS,
  toOrganizationMembershipTuple,
  toWorkspaceMembershipTuple,
  toWorkspaceParentTuple,
} from '../src/tuple-sync.js';

const createPermissionCheckerMock = () =>
  ({
    checkPermission: vi.fn(),
    bulkCheckPermission: vi.fn(),
    writeTuples: vi.fn(),
    deleteTuples: vi.fn(),
  }) as unknown as PermissionChecker;

describe('tuple sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes mixed operations in order', async () => {
    const permissionChecker = createPermissionCheckerMock();
    vi.mocked(permissionChecker.writeTuples).mockResolvedValue(undefined);
    vi.mocked(permissionChecker.deleteTuples).mockResolvedValue(undefined);

    await createPermifyAccessGraphSync(permissionChecker).apply([
      {
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'viewer',
          subject: { type: 'user', id: 'user_1', relation: '' },
        },
      },
      {
        type: 'delete',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'editor',
          subject: { type: 'user', id: 'user_1', relation: '' },
        },
      },
      {
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'manager',
          subject: { type: 'user', id: 'user_1', relation: '' },
        },
      },
    ]);

    expect(permissionChecker.writeTuples).toHaveBeenNthCalledWith(1, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'viewer',
      subject: { type: 'user', id: 'user_1', relation: '' },
    });
    expect(permissionChecker.deleteTuples).toHaveBeenNthCalledWith(1, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'editor',
      subject: { type: 'user', id: 'user_1', relation: '' },
    });
    expect(permissionChecker.writeTuples).toHaveBeenNthCalledWith(2, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'manager',
      subject: { type: 'user', id: 'user_1', relation: '' },
    });
  });

  it('stops on the first failed operation and propagates the error', async () => {
    const permissionChecker = createPermissionCheckerMock();
    const permifyError = new Error('permify down');
    vi.mocked(permissionChecker.writeTuples).mockResolvedValue(undefined);
    vi.mocked(permissionChecker.deleteTuples).mockRejectedValue(permifyError);

    await expect(
      createPermifyAccessGraphSync(permissionChecker).apply([
        {
          type: 'write',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'viewer',
            subject: { type: 'user', id: 'user_1', relation: '' },
          },
        },
        {
          type: 'delete',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'editor',
            subject: { type: 'user', id: 'user_1', relation: '' },
          },
        },
        {
          type: 'write',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'manager',
            subject: { type: 'user', id: 'user_1', relation: '' },
          },
        },
      ]),
    ).rejects.toBe(permifyError);

    expect(permissionChecker.writeTuples).toHaveBeenCalledTimes(1);
    expect(permissionChecker.deleteTuples).toHaveBeenCalledTimes(1);
  });

  it('propagates non-Error throwables without app-specific wrapping', async () => {
    const permissionChecker = createPermissionCheckerMock();
    vi.mocked(permissionChecker.writeTuples).mockRejectedValue('down');

    await expect(
      createPermifyAccessGraphSync(permissionChecker).apply({
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'viewer',
          subject: { type: 'user', id: 'user_1', relation: '' },
        },
      }),
    ).rejects.toBe('down');
  });

  it('builds relation tuples from current schema-owned relation names', () => {
    expect(
      toOrganizationMembershipTuple({
        userId: 'user_1',
        organizationId: 'org_1',
        organizationRole: 'admin',
        status: 'active',
        invitedBy: 'user_owner',
        joinedAt: new Date('2024-01-02T03:04:05.000Z'),
        createdAt: new Date('2024-01-02T03:04:05.000Z'),
        updatedAt: new Date('2024-01-02T03:04:05.000Z'),
      }),
    ).toMatchObject({
      entity: { type: 'organization', id: 'org_1' },
      relation: 'admin',
      subject: { type: 'user', id: 'user_1', relation: '' },
    });

    expect(
      toWorkspaceMembershipTuple({
        userId: 'user_1',
        workspaceId: 'ws_1',
        organizationId: 'org_1',
        workspaceRole: 'editor',
        createdAt: new Date('2024-01-02T03:04:05.000Z'),
        updatedAt: new Date('2024-01-02T03:04:05.000Z'),
      }),
    ).toMatchObject({
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'editor',
      subject: { type: 'user', id: 'user_1', relation: '' },
    });

    expect(
      toWorkspaceParentTuple({
        id: 'ws_1',
        organizationId: 'org_1',
        name: 'Docs',
        createdAt: new Date('2024-01-02T03:04:05.000Z'),
        updatedAt: new Date('2024-01-02T03:04:05.000Z'),
      }),
    ).toMatchObject({
      entity: { type: 'workspace', id: 'ws_1' },
      relation: PERMIFY_RELATIONS.workspaceParent,
      subject: { type: 'organization', id: 'org_1', relation: '' },
    });
  });
});
