import { describe, expect, it } from 'vitest';

import { createAuth } from '../../../src/lib/auth.js';
import { createTestDeps, testEnvFixture } from '../../helpers/test-deps.js';

describe('auth config', () => {
  it('locks Better Auth to the configured single app origin', () => {
    const auth = createAuth({ db: createTestDeps().db, env: testEnvFixture });

    expect(auth.options.baseURL).toBe(testEnvFixture.BETTER_AUTH_URL);
    expect(auth.options.basePath).toBe('/api/auth');
    expect(auth.options.trustedOrigins).toEqual([
      new URL(testEnvFixture.BETTER_AUTH_URL).origin,
    ]);
  });

  it('uses explicit cookie and email-password defaults for the current MVP', () => {
    const auth = createAuth({ db: createTestDeps().db, env: testEnvFixture });

    expect(auth.options.advanced?.useSecureCookies).toBe(
      testEnvFixture.NODE_ENV === 'production',
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
