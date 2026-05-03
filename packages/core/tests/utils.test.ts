import { CoreError } from '@syncpad/errors';
import { describe, expect, it, vi } from 'vitest';

import { syncOrThrow } from '../src/utils/index.js';

describe('syncOrThrow', () => {
  it('wraps access graph failures as retryable core errors', async () => {
    const cause = new Error('permify down');

    await expect(
      syncOrThrow({ apply: vi.fn().mockRejectedValue(cause) }, {
        type: 'write',
        tuples: {},
      } as never),
    ).rejects.toMatchObject({
      cause,
      code: 'PERMIFY_SYNC_FAILED',
      kind: 'dependency_unavailable',
      retryable: true,
    });
  });

  it('uses CoreError for sync failures', async () => {
    await expect(
      syncOrThrow({ apply: vi.fn().mockRejectedValue(new Error('boom')) }, {
        type: 'write',
        tuples: {},
      } as never),
    ).rejects.toBeInstanceOf(CoreError);
  });
});
