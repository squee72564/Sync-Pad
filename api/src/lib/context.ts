import type {
  AuthSessionInfo,
  AuthUser,
  OrganizationRecord,
  ValidatedRequestData,
  WorkspaceRecord,
} from '../types/api.js';

export const REQUEST_ID_CONTEXT_KEY = 'requestId';
export const SESSION_CONTEXT_KEY = 'session';
export const CURRENT_USER_CONTEXT_KEY = 'currentUser';
export const ORGANIZATION_CONTEXT_KEY = 'organization';
export const WORKSPACE_CONTEXT_KEY = 'workspace';
export const VALIDATED_CONTEXT_KEY = 'validated';
export const AUTHORIZATION_CONTEXT_KEY = 'authorization';

export type AppVariables = {
  requestId: string;
  session: AuthSessionInfo | null;
  currentUser: AuthUser | null;
  organization: OrganizationRecord | null;
  workspace: WorkspaceRecord | null;
  validated: ValidatedRequestData;
  authorization?: {
    checked: boolean;
    permission: string;
    resource: string;
  };
};
