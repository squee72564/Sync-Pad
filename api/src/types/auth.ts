import type { Session, User } from 'better-auth';

export type AuthSessionInfo = Session;
export type AuthUser = User;

export type AuthSession = {
  session: AuthSessionInfo;
  user: AuthUser;
};

export type ValidatedRequestData = {
  params?: unknown;
  query?: unknown;
  json?: unknown;
};
