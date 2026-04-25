import { Hono } from 'hono';

import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { healthRoute } from './routes/health.js';

export const app = new Hono();

app.use('*', async (context, next) => {
  const startedAt = Date.now();

  await next();

  logger.info(
    {
      method: context.req.method,
      path: context.req.path,
      status: context.res.status,
      durationMs: Date.now() - startedAt,
    },
    'request completed',
  );
});

app.get('/', (context) =>
  context.json({
    name: 'syncpad-api',
    env: env.NODE_ENV,
  }),
);

app.route('/', healthRoute);

app.on(['POST', 'GET'], '/api/auth/*', async (context) => {
  return auth.handler(context.req.raw);
});
