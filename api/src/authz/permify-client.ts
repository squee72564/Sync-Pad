import {
  createPermifyAccessGraphSync,
  createPermifyClient,
  createPermissionChecker,
} from '@syncpad/permify';
import { env } from '../lib/env.js';

export const permifyInstance = createPermifyClient({
  endpoint: env.PERMIFY_URL,
  tenantId: env.PERMIFY_TENANT_ID,
  schemaVersion: env.PERMIFY_SCHEMA_VERSION,
});

export const permissionChecker = createPermissionChecker(permifyInstance);

export const accessGraphSync = createPermifyAccessGraphSync(permissionChecker);
