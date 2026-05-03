import { PermifyError } from '@syncpad/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const permifyMocks = vi.hoisted(() => {
  const permifyInstance = {
    grpc: {},
    schemaVersion: 'schema_1',
    tenantId: 'tenant_1',
  };
  const rawPermissionChecker = {
    bulkCheckPermission: vi.fn(),
    checkPermission: vi.fn(),
    deleteTuples: vi.fn(),
    writeTuples: vi.fn(),
  };
  const accessGraphSync = {
    apply: vi.fn(),
  };

  return {
    accessGraphSync,
    createPermifyAccessGraphSync: vi.fn(() => accessGraphSync),
    createPermifyClient: vi.fn(() => permifyInstance),
    createPermissionChecker: vi.fn(() => rawPermissionChecker),
    permifyInstance,
    rawPermissionChecker,
  };
});

vi.mock('@syncpad/permify', () => ({
  createPermifyAccessGraphSync: permifyMocks.createPermifyAccessGraphSync,
  createPermifyClient: permifyMocks.createPermifyClient,
  createPermissionChecker: permifyMocks.createPermissionChecker,
}));

describe('api permify client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('constructs the app singleton from package factories and env config', async () => {
    const { env } = await import('../../../src/lib/env.js');
    const { accessGraphSync, permissionChecker, permifyInstance } =
      await import('../../../src/authz/permify-client.js');

    expect(permifyMocks.createPermifyClient).toHaveBeenCalledWith({
      endpoint: new URL(env.PERMIFY_GRPC_URL).host,
      insecure: env.NODE_ENV !== 'production',
      schemaVersion: env.PERMIFY_SCHEMA_VERSION,
      tenantId: env.PERMIFY_TENANT_ID,
    });
    expect(permifyMocks.createPermissionChecker).toHaveBeenCalledWith(
      permifyMocks.permifyInstance,
    );
    expect(permifyMocks.createPermifyAccessGraphSync).toHaveBeenCalledWith(
      permissionChecker,
    );
    expect(permifyInstance).toBe(permifyMocks.permifyInstance);
    expect(accessGraphSync).toBe(permifyMocks.accessGraphSync);
  });

  it('delegates successful permission checks to the package checker', async () => {
    permifyMocks.rawPermissionChecker.checkPermission.mockResolvedValue(true);
    const { permissionChecker } = await import(
      '../../../src/authz/permify-client.js'
    );
    const subject = { id: 'user_1', type: 'user', relation: '' };
    const resource = {
      type: 'organization',
      organizationId: 'org_1',
    } as const;

    await expect(
      permissionChecker.checkPermission(subject, resource, 'read'),
    ).resolves.toBe(true);
    expect(
      permifyMocks.rawPermissionChecker.checkPermission,
    ).toHaveBeenCalledWith(subject, resource, 'read');
  });

  it('bubbles package permission check errors unchanged', async () => {
    const transportError = new PermifyError({
      code: 'PERMIFY_UNAVAILABLE',
      kind: 'dependency_unavailable',
      message: 'transport down',
      retryable: true,
    });
    permifyMocks.rawPermissionChecker.checkPermission.mockRejectedValue(
      transportError,
    );
    const { permissionChecker } = await import(
      '../../../src/authz/permify-client.js'
    );

    await expect(
      permissionChecker.checkPermission(
        { id: 'user_1', type: 'user', relation: '' },
        { type: 'organization', organizationId: 'org_1' },
        'read',
      ),
    ).rejects.toBe(transportError);
  });

  it('bubbles invalid authorization descriptor errors unchanged', async () => {
    const descriptorError = new PermifyError({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      kind: 'invariant_violation',
      message: 'Invalid resource descriptor for organization',
    });
    permifyMocks.rawPermissionChecker.checkPermission.mockRejectedValue(
      descriptorError,
    );
    const { permissionChecker } = await import(
      '../../../src/authz/permify-client.js'
    );

    await expect(
      permissionChecker.checkPermission(
        { id: 'user_1', type: 'user', relation: '' },
        { type: 'organization', organizationId: undefined } as never,
        'read',
      ),
    ).rejects.toBe(descriptorError);
  });
});
