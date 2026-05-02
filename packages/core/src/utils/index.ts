import type { AccessGraphOperation, AccessGraphSync } from '@syncpad/permify';

export const syncOrThrow = async (
  accessGraphSync: AccessGraphSync,
  operation: AccessGraphOperation | AccessGraphOperation[],
) => {
  try {
    await accessGraphSync.apply(operation);
  } catch (_error) {
    throw new Error('Failed to synchronize organization access graph');
  }
};
