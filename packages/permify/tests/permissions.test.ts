import {
  type AttributeFilter,
  CheckResult,
  type Subject,
  type Tuple,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import { PermifyError } from '@syncpad/errors';
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

  it('serializes document resources using the registry id key', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.permission.check.mockResolvedValue({
      can: CheckResult.CHECK_RESULT_ALLOWED,
    });

    const allowed = await createPermissionChecker(instance).checkPermission(
      subject,
      resources.document('doc_1'),
      'write',
    );

    expect(allowed).toBe(true);
    expect(grpc.permission.check).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: {
          type: 'document',
          id: 'doc_1',
        },
        permission: 'write',
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

  it('sends a no-op attribute filter when deleting tuples', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.data.delete.mockResolvedValue({});

    const tuple: Tuple = {
      entity: {
        type: 'workspace',
        id: 'ws_1',
      },
      relation: 'editor',
      subject: {
        type: 'user',
        id: 'user_1',
        relation: '',
      },
    };

    await createPermissionChecker(instance).deleteTuples(tuple);

    expect(grpc.data.delete).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_1',
        tupleFilter: {
          entity: {
            type: 'workspace',
            ids: ['ws_1'],
          },
          relation: 'editor',
          subject: {
            type: 'user',
            ids: ['user_1'],
            relation: '',
          },
        },
        attributeFilter: {
          entity: {
            type: '__syncpad_noop_attribute_delete__',
            ids: ['__syncpad_noop_attribute_delete__'],
          },
          attributes: ['__syncpad_noop_attribute_delete__'],
        },
      },
      expect.any(Object),
    );
  });

  it('sends a no-op tuple filter when deleting attributes', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.data.delete.mockResolvedValue({});

    const attributeFilter: AttributeFilter = {
      entity: {
        type: 'document',
        ids: ['doc_1'],
      },
      attributes: ['is_private'],
    };

    await createPermissionChecker(instance).deleteAttributes(attributeFilter);

    expect(grpc.data.delete).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_1',
        tupleFilter: {
          entity: {
            type: '__syncpad_noop_tuple_delete__',
            ids: ['__syncpad_noop_tuple_delete__'],
          },
          relation: '__syncpad_noop_tuple_delete__',
          subject: {
            type: '__syncpad_noop_tuple_delete__',
            ids: ['__syncpad_noop_tuple_delete__'],
            relation: '',
          },
        },
        attributeFilter,
      },
      expect.any(Object),
    );
  });

  it('deletes tuple and attribute data with explicit filters', async () => {
    const { grpc, instance } = createTestInstance();
    grpc.data.delete.mockResolvedValue({});

    const tupleFilter = {
      entity: {
        type: 'document',
        ids: ['doc_1'],
      },
      relation: 'viewer',
      subject: {
        type: 'user',
        ids: ['user_1'],
        relation: '',
      },
    };
    const attributeFilter = {
      entity: {
        type: 'document',
        ids: ['doc_1'],
      },
      attributes: ['is_private'],
    };

    await createPermissionChecker(instance).deleteData({
      tupleFilter,
      attributeFilter,
    });

    expect(grpc.data.delete).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_1',
        tupleFilter,
        attributeFilter,
      },
      expect.any(Object),
    );
  });

  it('normalizes Permify client errors as unavailable errors', async () => {
    const { grpc, instance } = createTestInstance();
    const clientError = new Error('transport down');
    grpc.permission.check.mockRejectedValue(clientError);

    await expect(
      createPermissionChecker(instance).checkPermission(
        subject,
        resources.organization('org_1'),
        'read',
      ),
    ).rejects.toMatchObject({
      cause: clientError,
      code: 'PERMIFY_UNAVAILABLE',
      kind: 'dependency_unavailable',
      retryable: true,
    });
  });

  it('rejects invalid resource descriptors with a structured error', async () => {
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
    ).rejects.toMatchObject({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      kind: 'invariant_violation',
    });

    await expect(
      createPermissionChecker(instance).checkPermission(
        subject,
        {
          type: 'organization',
          organizationId: undefined,
        } as never,
        'read',
      ),
    ).rejects.toBeInstanceOf(PermifyError);
  });
});
