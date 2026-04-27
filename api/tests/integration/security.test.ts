import { Hono } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { requestIdMiddleware } from '../../src/middleware/request-id.js';
import { authSecurityMiddleware } from '../../src/middleware/security.js';

describe('security headers', () => {
  it('applies secure baseline headers to app responses', async () => {
    const app = createApp();
    const response = await app.request('/');

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('x-request-id')).toEqual(expect.any(String));
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
});

describe('auth security middleware', () => {
  it('rejects cross-site form posts', async () => {
    const app = new Hono();

    app.use('*', requestIdMiddleware);
    app.use('/api/auth/*', ...authSecurityMiddleware);
    app.post('/api/auth/test-security', (context) =>
      context.json({ ok: true }),
    );

    const response = await app.request('/api/auth/test-security', {
      body: 'email=test@example.com',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://evil.example.com',
      },
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(body).toEqual({
      code: 'CSRF_VALIDATION_FAILED',
      detail: 'Request failed CSRF validation.',
      instance: '/api/auth/test-security',
      requestId: expect.any(String),
      status: StatusCodes.FORBIDDEN,
      title: 'Forbidden',
      type: 'urn:syncpad:error:csrf-validation-failed',
    });
  });

  it('rejects oversized auth request bodies', async () => {
    const app = new Hono();

    app.use('*', requestIdMiddleware);
    app.use('/api/auth/*', ...authSecurityMiddleware);
    app.post('/api/auth/test-security', async (context) => {
      await context.req.text();
      return context.json({ ok: true });
    });

    const oversizedBody = 'a'.repeat(1024 * 1024 + 1);

    const response = await app.request('/api/auth/test-security', {
      body: oversizedBody,
      headers: {
        'content-length': String(oversizedBody.length),
        'content-type': 'text/plain',
        origin: 'http://localhost',
      },
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(StatusCodes.REQUEST_TOO_LONG);
    expect(body).toEqual({
      code: 'REQUEST_BODY_TOO_LARGE',
      detail: 'Request body is too large.',
      instance: '/api/auth/test-security',
      requestId: expect.any(String),
      status: StatusCodes.REQUEST_TOO_LONG,
      title: 'Request Entity Too Large',
      type: 'urn:syncpad:error:request-body-too-large',
    });
  });
});
