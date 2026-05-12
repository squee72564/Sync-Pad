import type { AuthSession } from '../../src/types/auth.js';

export const organizationRecord = {
  id: 'org_1',
  name: 'Acme',
  description: 'example org desc',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-03T03:04:05.000Z'),
};

export const workspaceRecord = {
  id: 'ws_1',
  organizationId: organizationRecord.id,
  name: 'Docs',
  description: 'Example workspace description.',
  color: '#808080FF',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-02T03:04:05.000Z'),
};

export const documentRecord = {
  id: 'doc_1',
  workspaceId: workspaceRecord.id,
  title: 'Planning',
  color: '#336699FF',
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-02T03:04:05.000Z'),
  deletedAt: null,
};

export const workspaceSummary = {
  ...workspaceRecord,
  organizationName: organizationRecord.name,
  workspaceRole: 'editor' as const,
};

export const organizationInviteRecord = {
  id: 'org_invite_1',
  organizationId: organizationRecord.id,
  email: 'user@example.com',
  tokenHash: 'token_hash_1',
  organizationRole: 'member' as const,
  status: 'pending' as const,
  invitedBy: 'user_2',
  acceptedBy: null,
  expiresAt: new Date('2024-02-02T03:04:05.000Z'),
  acceptedAt: null,
  declinedAt: null,
  revokedAt: null,
  lastSentAt: new Date('2024-01-02T03:04:05.000Z'),
  createdAt: new Date('2024-01-02T03:04:05.000Z'),
  updatedAt: new Date('2024-01-03T03:04:05.000Z'),
};

export const authenticatedSession: AuthSession = {
  session: {
    id: 'sess_1',
    userId: 'user_1',
    token: 'token_1',
    createdAt: new Date('2024-01-02T03:04:05.000Z'),
    updatedAt: new Date('2024-01-02T03:04:05.000Z'),
    expiresAt: new Date('2024-01-02T03:04:05.000Z'),
  },
  user: {
    id: 'user_1',
    email: 'user@example.com',
    emailVerified: true,
    name: 'User One',
    image: null,
    createdAt: new Date('2024-01-02T03:04:05.000Z'),
    updatedAt: new Date('2024-01-02T03:04:05.000Z'),
  },
};
