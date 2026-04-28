import { Hono } from 'hono';

import { errorHandler } from './http/error-handler.js';
import { notFoundHandler } from './http/not-found-handler.js';
import { auth } from './lib/auth.js';
import type { AppVariables } from './lib/context.js';
import { env } from './lib/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { requestLoggerMiddleware } from './middleware/request-logger.js';
import {
  authSecurityMiddleware,
  securityHeaders,
} from './middleware/security.js';
import { healthRoute } from './routes/health.js';
import { organizationsRoute } from './routes/organizations.js';
import { workspacesRoute } from './routes/workspaces.js';

export const createApp = () => {
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

  app.route('/', healthRoute);

  app.use('/api/auth/*', ...authSecurityMiddleware);

  app.on(['POST', 'GET'], '/api/auth/*', async (context) => {
    return auth.handler(context.req.raw);
  });

  app.route('/api/organizations', organizationsRoute);
  app.route('/api/workspaces', workspacesRoute);

  app.notFound(notFoundHandler);
  app.onError(errorHandler);

  return app;
};

export const app = createApp();
