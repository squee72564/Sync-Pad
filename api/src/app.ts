import { Hono } from 'hono';
import type { ApiDeps } from './bootstrap/deps.js';
import { errorHandler } from './http/error-handler.js';
import { notFoundHandler } from './http/not-found-handler.js';
import type { AppVariables } from './lib/context.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLoggerMiddleware } from './middleware/request-logger.js';
import {
  authSecurityMiddleware,
  securityHeaders,
} from './middleware/security.js';
import { createOrganizationWorkspaceDocumentsRoute } from './routes/documents.js';
import { createHealthRoute } from './routes/health.js';
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
  } = deps;

  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', securityHeaders);
  app.use('*', requestIdMiddleware);
  app.use('*', requestLoggerMiddleware);

  app.get('/', (context) =>
    context.json({
      name: 'syncpad-api',
      env: env.NODE_ENV,
    }),
  );

  app.route('/', createHealthRoute({ pool }));

  app.use('/api/auth/*', ...authSecurityMiddleware);

  app.on(['POST', 'GET'], '/api/auth/*', async (context) => {
    return auth.handler(context.req.raw);
  });

  app.route(
    '/api/me',
    createMeRoute({ workspaceService, organizationService, auth }),
  );
  app.route(
    '/api/organizations',
    createOrganizationsRoute({
      organizationService,
      workspaceService,
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

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
};

export type ApiService = ReturnType<typeof createApp>;
