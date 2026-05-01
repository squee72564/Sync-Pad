import { StatusCodes } from 'http-status-codes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkPermission } from '../../../src/authz/permify-client.js';
import { resources } from '../../../src/authz/permissions.js';
import { env } from '../../../src/lib/env.js';

describe('permify client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('serializes organization resources using the registry id key', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ can: true }),
    });

    const allowed = await checkPermission(
      'user_1',
      resources.organization('org_1'),
      'read',
    );

    expect(allowed).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/permissions/check'),
      expect.objectContaining({
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(requestInit.body as string)).toEqual({
      tenantId: 'syncpad-test',
      metadata: {
        snapToken: '',
        schemaVersion: env.PERMIFY_SCHEMA_VERSION,
        depth: 20,
      },
      entity: {
        type: 'organization',
        id: 'org_1',
      },
      permission: 'read',
      subject: {
        type: 'user',
        id: 'user_1',
        relation: '',
      },
    });
  });

  it('serializes workspace resources using the registry id key', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ can: 'RESULT_ALLOWED' }),
    });

    const allowed = await checkPermission(
      'user_1',
      resources.workspace('ws_1'),
      'manage',
    );

    expect(allowed).toBe(true);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      entity: {
        type: 'workspace',
        id: 'ws_1',
      },
      permission: 'manage',
      subject: {
        type: 'user',
        id: 'user_1',
      },
    });
  });

  it('wraps fetch failures as PERMIFY_UNAVAILABLE', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(
      checkPermission('user_1', resources.organization('org_1'), 'read'),
    ).rejects.toMatchObject({
      code: 'PERMIFY_UNAVAILABLE',
      status: StatusCodes.SERVICE_UNAVAILABLE,
    });
  });

  it('wraps non-2xx responses as PERMIFY_UNAVAILABLE with response status details', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'service down',
    });

    await expect(
      checkPermission('user_1', resources.organization('org_1'), 'read'),
    ).rejects.toMatchObject({
      code: 'PERMIFY_UNAVAILABLE',
      status: StatusCodes.SERVICE_UNAVAILABLE,
      details: {
        responseBody: 'service down',
        responseStatus: 503,
      },
    });
  });

  it('rejects invalid resource descriptors', async () => {
    await expect(
      checkPermission(
        'user_1',
        {
          type: 'organization',
          organizationId: undefined,
        } as never,
        'read',
      ),
    ).rejects.toMatchObject({
      code: 'AUTHORIZATION_CONTEXT_INVALID',
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
