import {
  createPermifyAccessGraphSync,
  createPermifyClient,
  createPermissionChecker,
  type PermissionChecker,
} from '@syncpad/permify';
import { StatusCodes } from 'http-status-codes';
import { env } from '../lib/env.js';
import { AppError } from '../lib/error.js';

export const permifyInstance = createPermifyClient({
  endpoint: env.PERMIFY_URL,
  tenantId: env.PERMIFY_TENANT_ID,
  schemaVersion: env.PERMIFY_SCHEMA_VERSION,
});

const normalizePermissionChecker = (
  checker: PermissionChecker,
): PermissionChecker => ({
  ...checker,
  async checkPermission(...args) {
    try {
      return await checker.checkPermission(...args);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Invalid resource descriptor')
      ) {
        throw new AppError({
          cause: error,
          code: 'AUTHORIZATION_CONTEXT_INVALID',
          message: error.message,
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }

      throw new AppError({
        cause: error,
        code: 'PERMIFY_UNAVAILABLE',
        message: 'Permify permission check failed',
        status: StatusCodes.SERVICE_UNAVAILABLE,
        userMessage: 'Authorization service is unavailable.',
      });
    }
  },
});

export const permissionChecker = normalizePermissionChecker(
  createPermissionChecker(permifyInstance),
);

export const accessGraphSync = createPermifyAccessGraphSync(permissionChecker);
