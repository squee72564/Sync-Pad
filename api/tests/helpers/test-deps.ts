import type {
  DocumentService,
  OrganizationService,
  WorkspaceService,
} from '@syncpad/core';
import type {
  DbClient,
  DbPool,
  DocumentRepository,
  OrganizationRepository,
  WorkspaceRepository,
} from '@syncpad/db';
import type { PermissionChecker } from '@syncpad/permify';
import { vi } from 'vitest';
import { createApp } from '../../src/app.js';
import type { ApiDeps } from '../../src/bootstrap/deps.js';
import type { Auth } from '../../src/lib/auth.js';
import type { Env } from '../../src/lib/env.js';
import type { Mailer } from '../../src/mail/mailer.js';
import type { AuthSession } from '../../src/types/auth.js';

export const testEnvFixture: Env = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  PORT: 3001,
  DATABASE_URL: 'postgres://syncpad:syncpad@127.0.0.1:5432/syncpad_test',
  BETTER_AUTH_SECRET: 'test-secret-value-123',
  BETTER_AUTH_URL: 'http://localhost:3001',
  PERMIFY_HTTP_URL: 'http://localhost:3476',
  PERMIFY_GRPC_URL: 'localhost:3478',
  PERMIFY_TENANT_ID: 'syncpad-test',
  PERMIFY_SCHEMA_VERSION: 'test',
  RESEND_API_KEY: 're_test',
  MAIL_FROM: 'Syncpad <invitations@example.com>',
  ORGANIZATION_INVITE_TTL_HOURS: 168,
};

export const createTestAuth = (session: AuthSession | null = null): Auth =>
  ({
    api: {
      getSession: vi.fn().mockResolvedValue(session),
    },
    handler: vi.fn(() => new Response(null, { status: 404 })),
    options: {
      advanced: {
        defaultCookieAttributes: {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
        },
        useSecureCookies: false,
      },
      basePath: '/api/auth',
      baseURL: testEnvFixture.BETTER_AUTH_URL,
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      trustedOrigins: [new URL(testEnvFixture.BETTER_AUTH_URL).origin],
    },
  }) as unknown as Auth;

export const createTestDeps = (overrides: Partial<ApiDeps> = {}): ApiDeps => {
  const deps = {
    auth: createTestAuth(),
    db: {} as DbClient,
    documentRepository: {
      findById: vi.fn(),
      findInWorkspace: vi.fn(),
      listByWorkspaceReadableToUser: vi.fn(),
      listByWorkspaceReadableToUserPage: vi.fn(),
    } as unknown as DocumentRepository,
    documentService: {
      createDocument: vi.fn(),
      deleteDocument: vi.fn(),
      findInWorkspace: vi.fn(),
      listByWorkspaceReadableToUser: vi.fn(),
      listByWorkspaceReadableToUserPage: vi.fn(),
      softDeleteDocument: vi.fn(),
      updateDocument: vi.fn(),
    } as unknown as DocumentService,
    env: testEnvFixture,
    mailService: {
      organizationInvite: {
        baseUrl: testEnvFixture.BETTER_AUTH_URL,
        ttlHours: testEnvFixture.ORGANIZATION_INVITE_TTL_HOURS,
      },
      sendOrganizationInvite: vi.fn(),
    } as unknown as Mailer,
    organizationRepository: {
      findById: vi.fn(),
      listMemberships: vi.fn(),
    } as unknown as OrganizationRepository,
    organizationService: {
      addMember: vi.fn(),
      createOrganization: vi.fn(),
      deleteMember: vi.fn(),
      findById: vi.fn(),
      getOrganizationAccess: vi.fn().mockResolvedValue({
        permissions: {
          read: true,
          manage: true,
          invite: true,
          create_workspace: true,
          run_ai: true,
        },
      }),
      listMemberships: vi.fn(),
      listOrganizationsForUser: vi.fn(),
      listOrganizationsForUserPage: vi.fn(),
      updateMember: vi.fn(),
      updateOrganization: vi.fn(),
    } as unknown as OrganizationService,
    permissionChecker: {
      checkPermission: vi.fn().mockResolvedValue(true),
      writeTuples: vi.fn(),
    } as unknown as PermissionChecker,
    pool: {
      end: vi.fn(),
      query: vi.fn(),
    } as unknown as DbPool,
    workspaceRepository: {
      findById: vi.fn(),
      listMemberships: vi.fn(),
    } as unknown as WorkspaceRepository,
    workspaceService: {
      addMember: vi.fn(),
      createWorkspace: vi.fn(),
      deleteMember: vi.fn(),
      deleteWorkspace: vi.fn(),
      findById: vi.fn(),
      findInOrganization: vi.fn(),
      getWorkspaceAccess: vi.fn().mockResolvedValue({
        permissions: {
          read: true,
          manage: true,
          invite: true,
          write: true,
          comment: true,
          run_ai: true,
        },
      }),
      listByOrganizationReadableToUser: vi.fn(),
      listMemberships: vi.fn(),
      listReadableToUser: vi.fn(),
      listReadableToUserPage: vi.fn(),
      updateMember: vi.fn(),
      updateWorkspace: vi.fn(),
    } as unknown as WorkspaceService,
  };

  return {
    ...deps,
    ...overrides,
  };
};

export const createTestApp = (overrides: Partial<ApiDeps> = {}) =>
  createApp(createTestDeps(overrides));
