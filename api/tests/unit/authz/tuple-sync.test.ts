import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/authz/permify-client.js', () => ({
  writeTuples: vi.fn(),
  deleteTuples: vi.fn(),
}));

import {
  deleteTuples,
  writeTuples,
} from '../../../src/authz/permify-client.js';
import { permifyAccessGraphSync } from '../../../src/authz/tuple-sync.js';

describe('tuple sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes mixed operations in order', async () => {
    vi.mocked(writeTuples).mockResolvedValue(undefined);
    vi.mocked(deleteTuples).mockResolvedValue(undefined);

    await permifyAccessGraphSync.apply([
      {
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'viewer',
          subject: { type: 'user', id: 'user_1' },
        },
      },
      {
        type: 'delete',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'editor',
          subject: { type: 'user', id: 'user_1' },
        },
      },
      {
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'manager',
          subject: { type: 'user', id: 'user_1' },
        },
      },
    ]);

    expect(writeTuples).toHaveBeenNthCalledWith(1, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'viewer',
      subject: { type: 'user', id: 'user_1' },
    });
    expect(deleteTuples).toHaveBeenNthCalledWith(1, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'editor',
      subject: { type: 'user', id: 'user_1' },
    });
    expect(writeTuples).toHaveBeenNthCalledWith(2, {
      entity: { type: 'workspace', id: 'ws_1' },
      relation: 'manager',
      subject: { type: 'user', id: 'user_1' },
    });
  });

  it('stops on the first failed operation', async () => {
    vi.mocked(writeTuples).mockResolvedValue(undefined);
    vi.mocked(deleteTuples).mockRejectedValue(new Error('permify down'));

    await expect(
      permifyAccessGraphSync.apply([
        {
          type: 'write',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'viewer',
            subject: { type: 'user', id: 'user_1' },
          },
        },
        {
          type: 'delete',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'editor',
            subject: { type: 'user', id: 'user_1' },
          },
        },
        {
          type: 'write',
          tuples: {
            entity: { type: 'workspace', id: 'ws_1' },
            relation: 'manager',
            subject: { type: 'user', id: 'user_1' },
          },
        },
      ]),
    ).rejects.toMatchObject({
      name: 'PermifySyncError',
      message: 'permify down',
    });

    expect(writeTuples).toHaveBeenCalledTimes(1);
    expect(deleteTuples).toHaveBeenCalledTimes(1);
  });

  it('wraps non-Error throwables in a PermifySyncError', async () => {
    vi.mocked(writeTuples).mockRejectedValue('down');

    await expect(
      permifyAccessGraphSync.apply({
        type: 'write',
        tuples: {
          entity: { type: 'workspace', id: 'ws_1' },
          relation: 'viewer',
          subject: { type: 'user', id: 'user_1' },
        },
      }),
    ).rejects.toMatchObject({
      name: 'PermifySyncError',
      message: 'Permify sync failed',
    });
  });
});
