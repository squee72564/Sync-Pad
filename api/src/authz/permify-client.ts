import {
  createPermifyAccessGraphSync,
  createPermifyClient,
  createPermissionChecker,
} from '@syncpad/permify';
import { env } from '../lib/env.js';

const toGrpcEndpoint = (value: string) => {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
};

export const permifyInstance = createPermifyClient({
  endpoint: toGrpcEndpoint(env.PERMIFY_GRPC_URL),
  tenantId: env.PERMIFY_TENANT_ID,
  schemaVersion: env.PERMIFY_SCHEMA_VERSION,
  insecure: env.NODE_ENV !== 'production',
});

export const permissionChecker = createPermissionChecker(permifyInstance);

export const accessGraphSync = createPermifyAccessGraphSync(permissionChecker);
