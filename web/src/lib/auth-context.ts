import { authClient } from './auth-client';

type BrowserAuthClient = typeof authClient;

export type AuthContext = {
  getSession: BrowserAuthClient['getSession'];
};

export function createBrowserAuthContext(): AuthContext {
  return {
    getSession: authClient.getSession,
  };
}
