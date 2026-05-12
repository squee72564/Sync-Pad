import { Hono } from 'hono';
import type { ApiDeps } from './bootstrap/deps.js';
import { createErrorHandler } from './http/error-handler.js';
import { createNotFoundHandler } from './http/not-found-handler.js';
import type { AppVariables } from './lib/context.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLoggerMiddleware } from './middleware/request-logger.js';
import {
  createAuthSecurityMiddleware,
  createSecurityHeaders,
} from './middleware/security.js';
import { createOrganizationWorkspaceDocumentsRoute } from './routes/documents.js';
import { createHealthRoute } from './routes/health.js';
import {
  createInvitationsRoute,
  createOrganizationInvitationsRoute,
} from './routes/invite.js';
import { createMeRoute } from './routes/me.js';
import { createOrganizationsRoute } from './routes/organizations.js';
import { createOrganizationWorkspacesRoute } from './routes/workspaces.js';

export const createApp = (deps: ApiDeps) => {
  const {
    pool,
    documentService,
    workspaceService,
    organizationService,
    permissionChecker,
    auth,
    env,
    mailService,
  } = deps;

  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', createSecurityHeaders(env));
  app.use('*', requestIdMiddleware);
  app.use('*', requestLoggerMiddleware);

  app.get('/', (context) =>
    context.json({
      name: 'syncpad-api',
      env: env.NODE_ENV,
    }),
  );

  app.route('/', createHealthRoute({ pool }));

  app.use('/api/auth/*', ...createAuthSecurityMiddleware(env));

  app.on(['POST', 'GET'], '/api/auth/*', async (context) => {
    return auth.handler(context.req.raw);
  });

  app.route(
    '/api/me',
    createMeRoute({ workspaceService, organizationService, auth }),
  );
  app.route(
    '/api/organizations/:organizationId/invitations',
    createInvitationsRoute({
      organizationService,
      auth,
    }),
  );
  app.route(
    '/api/organizations/:organizationId/invitations',
    createOrganizationInvitationsRoute({
      organizationService,
      auth,
      mailService,
      permissionChecker,
    }),
  );
  app.route(
    '/api/organizations',
    createOrganizationsRoute({
      organizationService,
      permissionChecker,
      auth,
    }),
  );
  app.route(
    '/api/organizations/:organizationId/workspaces',
    createOrganizationWorkspacesRoute({
      organizationService,
      workspaceService,
      permissionChecker,
      auth,
    }),
  );
  app.route(
    '/api/organizations/:organizationId/workspaces/:workspaceId/documents',
    createOrganizationWorkspaceDocumentsRoute({
      organizationService,
      workspaceService,
      documentService,
      permissionChecker,
      auth,
    }),
  );

  app.notFound(createNotFoundHandler(env));
  app.onError(createErrorHandler(env));

  return app;
};

export type ApiService = ReturnType<typeof createApp>;
