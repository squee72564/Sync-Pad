import {
  CheckResult,
  type Subject,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PermifyInstance } from '../src/client.js';
import { createPermissionChecker } from '../src/permissions.js';
import { resources } from '../src/types.js';

const subject: Subject = {
  id: 'user_1',
  type: 'user',
  relation: '',
};

const createTestInstance = () => {
  const grpc = {
    permission: {
      check: vi.fn(),
      bulkCheck: vi.fn(),
    },
    data: {
      write: vi.fn(),
      delete: vi.fn(),
    },
  };

  return {
    grpc,
    instance: {
      grpc,
      schemaVersion: 'schema_1',
      tenantId: 'tenant_1',
    } as unknown as PermifyInstance,
  };
};

describe('permission checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes organization resources using the registry id key', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.permission.check.mockResolvedValue({
      can: CheckResult.CHECK_RESULT_ALLOWED,
    });

    const allowed = await createPermissionChecker(instance).checkPermission(
      subject,
      resources.organization('org_1'),
      'read',
    );

    expect(allowed).toBe(true);
    expect(grpc.permission.check).toHaveBeenCalledWith({
      tenantId: 'tenant_1',
      metadata: {
        snapToken: '',
        depth: 20,
        schemaVersion: 'schema_1',
      },
      entity: {
        type: 'organization',
        id: 'org_1',
      },
      permission: 'read',
      subject,
    });
  });

  it('serializes workspace resources using the registry id key', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.permission.check.mockResolvedValue({
      can: CheckResult.CHECK_RESULT_ALLOWED,
    });

    const allowed = await createPermissionChecker(instance).checkPermission(
      subject,
      resources.workspace('ws_1'),
      'manage',
      12,
    );

    expect(allowed).toBe(true);
    expect(grpc.permission.check).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          depth: 12,
        }),
        entity: {
          type: 'workspace',
          id: 'ws_1',
        },
        permission: 'manage',
      }),
    );
  });

  it('returns false when Permify denies the permission', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.permission.check.mockResolvedValue({
      can: CheckResult.CHECK_RESULT_DENIED,
    });

    await expect(
      createPermissionChecker(instance).checkPermission(
        subject,
        resources.organization('org_1'),
        'read',
      ),
    ).resolves.toBe(false);
  });

  it('propagates Permify client errors without app-specific normalization', async () => {
    const { grpc, instance } = createTestInstance();
    const clientError = new Error('transport down');
    grpc.permission.check.mockRejectedValue(clientError);

    await expect(
      createPermissionChecker(instance).checkPermission(
        subject,
        resources.organization('org_1'),
        'read',
      ),
    ).rejects.toBe(clientError);
  });

  it('rejects invalid resource descriptors with a plain error', async () => {
    const { instance } = createTestInstance();

    await expect(
      createPermissionChecker(instance).checkPermission(
        subject,
        {
          type: 'organization',
          organizationId: undefined,
        } as never,
        'read',
      ),
    ).rejects.toThrow('Invalid resource descriptor for organization');
  });
});
