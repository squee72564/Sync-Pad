import { describe, expect, it } from 'vitest';

import { auth } from '../../../src/lib/auth.js';
import { env } from '../../../src/lib/env.js';

describe('auth config', () => {
  it('locks Better Auth to the configured single app origin', () => {
    expect(auth.options.baseURL).toBe(env.BETTER_AUTH_URL);
    expect(auth.options.basePath).toBe('/api/auth');
    expect(auth.options.trustedOrigins).toEqual([
      new URL(env.BETTER_AUTH_URL).origin,
    ]);
  });

  it('uses explicit cookie and email-password defaults for the current MVP', () => {
    expect(auth.options.advanced?.useSecureCookies).toBe(
      env.NODE_ENV === 'production',
    );
    expect(auth.options.advanced?.defaultCookieAttributes).toMatchObject({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      requireEmailVerification: false,
    });
  });
});
