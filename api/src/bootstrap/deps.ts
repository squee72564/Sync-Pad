import {
  createDocumentService,
  createOrganizationService,
  createWorkspaceService,
} from '@syncpad/core';
import {
  createDbClientAndPool,
  createDocumentRepository,
  createOrganizationRepository,
  createWorkspaceRepository,
} from '@syncpad/db';
import {
  createPermifyAccessGraphSync,
  createPermifyClient,
  createPermissionChecker,
} from '@syncpad/permify';
import { createAuth } from '../lib/auth.js';
import type { Env } from '../lib/env.js';
import { createResendMailer } from '../mail/index.js';

export const createApiDeps = (env: Env) => {
  const { client: db, pool } = createDbClientAndPool(env.DATABASE_URL);
  const organizationRepository = createOrganizationRepository(db);
  const workspaceRepository = createWorkspaceRepository(db);
  const documentRepository = createDocumentRepository(db);

  const toGrpcEndpoint = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.host || value;
    } catch {
      return value;
    }
  };

  const permifyInstance = createPermifyClient({
    endpoint: toGrpcEndpoint(env.PERMIFY_GRPC_URL),
    tenantId: env.PERMIFY_TENANT_ID,
    schemaVersion: env.PERMIFY_SCHEMA_VERSION,
    insecure: env.PERMIFY_GRPC_INSECURE,
    requestTimeoutMs: env.PERMIFY_REQUEST_TIMEOUT_MS,
  });

  const permissionChecker = createPermissionChecker(permifyInstance);

  const accessGraphSync = createPermifyAccessGraphSync(permissionChecker);

  const organizationService = createOrganizationService({
    accessGraphSync,
    permissionChecker,
    organizationRepo: organizationRepository,
    workspaceRepo: workspaceRepository,
    db,
  });

  const workspaceService = createWorkspaceService({
    permissionChecker,
    accessGraphSync,
    organizationRepo: organizationRepository,
    workspaceRepo: workspaceRepository,
    db,
  });

  const documentService = createDocumentService({
    accessGraphSync,
    documentRepo: documentRepository,
    workspaceRepo: workspaceRepository,
    permissionChecker,
    db,
  });

  const auth = createAuth({ db, env });

  const mailService = createResendMailer(env);

  return {
    env,
    db,
    pool,
    organizationService,
    organizationRepository,
    workspaceService,
    workspaceRepository,
    documentService,
    documentRepository,
    permissionChecker,
    auth,
    mailService,
  };
};

export type ApiDeps = ReturnType<typeof createApiDeps>;
