import { StatusCodes } from 'http-status-codes';
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
      endpoint: env.PERMIFY_URL,
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

  it('normalizes permission check transport failures as PERMIFY_UNAVAILABLE', async () => {
    const transportError = new Error('transport down');
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
    ).rejects.toMatchObject({
      cause: transportError,
      code: 'PERMIFY_UNAVAILABLE',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('normalizes invalid authorization descriptors as app context errors', async () => {
    const descriptorError = new Error(
      'Invalid resource descriptor for organization',
    );
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
    ).rejects.toMatchObject({
      cause: descriptorError,
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
