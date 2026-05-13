import { beforeEach, describe, expect, it, vi } from 'vitest';

const depsMocks = vi.hoisted(() => {
  const db = {};
  const pool = {};
  const organizationRepository = {};
  const workspaceRepository = {};
  const documentRepository = {};
  const organizationService = {};
  const workspaceService = {};
  const documentService = {};
  const permifyInstance = {};
  const permissionChecker = {};
  const accessGraphSync = {};

  return {
    accessGraphSync,
    createDbClientAndPool: vi.fn(() => ({ client: db, pool })),
    createDocumentRepository: vi.fn(() => documentRepository),
    createDocumentService: vi.fn(() => documentService),
    createOrganizationRepository: vi.fn(() => organizationRepository),
    createOrganizationService: vi.fn(() => organizationService),
    createPermifyAccessGraphSync: vi.fn(() => accessGraphSync),
    createPermifyClient: vi.fn(() => permifyInstance),
    createPermissionChecker: vi.fn(() => permissionChecker),
    createWorkspaceRepository: vi.fn(() => workspaceRepository),
    createWorkspaceService: vi.fn(() => workspaceService),
    db,
    documentRepository,
    documentService,
    organizationRepository,
    organizationService,
    permissionChecker,
    permifyInstance,
    pool,
    workspaceRepository,
    workspaceService,
  };
});

vi.mock('@syncpad/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@syncpad/db')>();

  return {
    ...actual,
    createDbClientAndPool: depsMocks.createDbClientAndPool,
    createDocumentRepository: depsMocks.createDocumentRepository,
    createOrganizationRepository: depsMocks.createOrganizationRepository,
    createWorkspaceRepository: depsMocks.createWorkspaceRepository,
  };
});

vi.mock('@syncpad/core', () => ({
  createDocumentService: depsMocks.createDocumentService,
  createOrganizationService: depsMocks.createOrganizationService,
  createWorkspaceService: depsMocks.createWorkspaceService,
}));

vi.mock('@syncpad/permify', () => ({
  createPermifyAccessGraphSync: depsMocks.createPermifyAccessGraphSync,
  createPermifyClient: depsMocks.createPermifyClient,
  createPermissionChecker: depsMocks.createPermissionChecker,
}));

vi.mock('../../../src/lib/auth.js', () => ({
  createAuth: vi.fn(() => ({ handler: vi.fn(), api: { getSession: vi.fn() } })),
}));

describe('api dependency bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const expectedGrpcEndpoint = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.host || value;
    } catch {
      return value;
    }
  };

  it('constructs Permify dependencies from env config', async () => {
    const { createApiDeps } = await import('../../../src/bootstrap/deps.js');
    const { env } = await import('../../../src/lib/env.js');

    const deps = createApiDeps(env);

    expect(depsMocks.createPermifyClient).toHaveBeenCalledWith({
      endpoint: expectedGrpcEndpoint(env.PERMIFY_GRPC_URL),
      insecure: env.PERMIFY_GRPC_INSECURE,
      requestTimeoutMs: env.PERMIFY_REQUEST_TIMEOUT_MS,
      schemaVersion: env.PERMIFY_SCHEMA_VERSION,
      tenantId: env.PERMIFY_TENANT_ID,
    });
    expect(depsMocks.createPermissionChecker).toHaveBeenCalledWith(
      depsMocks.permifyInstance,
    );
    expect(depsMocks.createPermifyAccessGraphSync).toHaveBeenCalledWith(
      depsMocks.permissionChecker,
    );
    expect(deps.permissionChecker).toBe(depsMocks.permissionChecker);
  });

  it('preserves scheme-less host:port Permify gRPC endpoints', async () => {
    const { createApiDeps } = await import('../../../src/bootstrap/deps.js');
    const { env } = await import('../../../src/lib/env.js');

    createApiDeps({
      ...env,
      PERMIFY_GRPC_URL: 'permify:3478',
    });

    expect(depsMocks.createPermifyClient).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'permify:3478',
      }),
    );
  });

  it('wires repositories and services from one database client', async () => {
    const { createApiDeps } = await import('../../../src/bootstrap/deps.js');
    const { env } = await import('../../../src/lib/env.js');

    const deps = createApiDeps(env);

    expect(depsMocks.createDbClientAndPool).toHaveBeenCalledWith(
      env.DATABASE_URL,
    );
    expect(depsMocks.createOrganizationRepository).toHaveBeenCalledWith(
      depsMocks.db,
    );
    expect(depsMocks.createWorkspaceRepository).toHaveBeenCalledWith(
      depsMocks.db,
    );
    expect(depsMocks.createDocumentRepository).toHaveBeenCalledWith(
      depsMocks.db,
    );
    expect(depsMocks.createOrganizationService).toHaveBeenCalledWith({
      accessGraphSync: depsMocks.accessGraphSync,
      db: depsMocks.db,
      documentRepo: depsMocks.documentRepository,
      organizationRepo: depsMocks.organizationRepository,
      permissionChecker: depsMocks.permissionChecker,
      workspaceRepo: depsMocks.workspaceRepository,
    });
    expect(depsMocks.createWorkspaceService).toHaveBeenCalledWith({
      accessGraphSync: depsMocks.accessGraphSync,
      db: depsMocks.db,
      documentRepo: depsMocks.documentRepository,
      organizationRepo: depsMocks.organizationRepository,
      permissionChecker: depsMocks.permissionChecker,
      workspaceRepo: depsMocks.workspaceRepository,
    });
    expect(depsMocks.createDocumentService).toHaveBeenCalledWith({
      accessGraphSync: depsMocks.accessGraphSync,
      db: depsMocks.db,
      documentRepo: depsMocks.documentRepository,
      permissionChecker: depsMocks.permissionChecker,
      workspaceRepo: depsMocks.workspaceRepository,
    });
    expect(deps.db).toBe(depsMocks.db);
    expect(deps.pool).toBe(depsMocks.pool);
  });
});
