import { CoreError } from '@syncpad/errors';
import type { AccessGraphOperation, AccessGraphSync } from '@syncpad/permify';

export const syncOrThrow = async (
  accessGraphSync: AccessGraphSync,
  operation: AccessGraphOperation | AccessGraphOperation[],
) => {
  try {
    await accessGraphSync.apply(operation);
  } catch (error) {
    throw new CoreError({
      cause: error,
      code: 'PERMIFY_SYNC_FAILED',
      kind: 'dependency_unavailable',
      message: 'Failed to synchronize access graph',
      retryable: true,
      userMessage: 'Authorization updates could not be completed.',
    });
  }
};
