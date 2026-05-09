import { createAuthClient } from 'better-auth/react';

export type AuthContext = ReturnType<typeof createAuthClient>;

export function createBrowserAuthContext(): AuthContext {
  return createAuthClient({
    basePath: '/api/auth',
  });
}
