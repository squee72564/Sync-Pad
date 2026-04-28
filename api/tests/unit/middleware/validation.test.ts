import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../../../src/http/error-handler.js';
import type { AppVariables } from '../../../src/lib/context.js';
import {
  getValidated,
  validateRequest,
} from '../../../src/middleware/validation.js';

describe('validation middleware', () => {
  it('stores parsed request data in context', async () => {
    const app = new Hono<{ Variables: AppVariables }>();
    app.post(
      '/organizations/:organizationId',
      validateRequest({
        params: z.object({ organizationId: z.string().min(1) }),
        query: z.object({ include: z.string() }),
        json: z.object({ name: z.string() }),
      }),
      (context) => {
        const validated = getValidated<{
          params: { organizationId: string };
          query: { include: string };
          json: { name: string };
        }>(context);

        return context.json(validated, StatusCodes.OK);
      },
    );

    const response = await app.request('/organizations/org_1?include=members', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Acme' }),
    });

    expect(response.status).toBe(StatusCodes.OK);
    expect(await response.json()).toEqual({
      params: { organizationId: 'org_1' },
      query: { include: 'members' },
      json: { name: 'Acme' },
    });
  });

  it('normalizes zod issues into a 400 AppError', async () => {
    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', async (context, next) => {
      context.set('requestId', 'req_test');
      await next();
    });
    app.post(
      '/organizations/:organizationId',
      validateRequest({
        params: z.object({ organizationId: z.string().uuid() }),
        json: z.object({ name: z.string().min(3) }),
      }),
      () => new Response(null),
    );
    app.onError(errorHandler);

    const response = await app.request('/organizations/not-a-uuid', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'x' }),
    });
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(body).toMatchObject({
      code: 'VALIDATION_FAILED',
      detail: 'Request validation failed.',
      status: StatusCodes.BAD_REQUEST,
      details: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String),
            path: expect.any(String),
          }),
        ]),
      },
    });
  });
});
