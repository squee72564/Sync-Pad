import { Hono } from 'hono';

import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import { AppError, toAppError } from './lib/error.js';
import { logger } from './lib/logger.js';
import { healthRoute } from './routes/health.js';

export const createApp = () => {
  const app = new Hono();

  app.use('*', async (context, next) => {
    const startedAt = Date.now();
    let completed = false;

    try {
      await next();
      completed = true;
    } finally {
      if (completed) {
        logger.info(
          {
            method: context.req.method,
            path: context.req.path,
            status: context.res.status,
            durationMs: Date.now() - startedAt,
          },
          'request completed',
        );
      }
    }
  });

  app.get('/', (context) =>
    context.json({
      name: 'syncpad-api',
      env: env.NODE_ENV,
    }),
  );

  app.route('/', healthRoute);

  app.notFound((context) => {
    const error = new AppError({
      code: 'ROUTE_NOT_FOUND',
      expose: true,
      message: `No route matched ${context.req.method} ${context.req.path}`,
      status: 404,
      userMessage: 'The requested resource was not found.',
    });

    return context.json(
      error.toProblem(env.NODE_ENV, {
        instance: context.req.path,
      }),
      error.status,
    );
  });

  app.onError((error, context) => {
    const appError = toAppError(error, {
      metadata: {
        method: context.req.method,
        path: context.req.path,
      },
      requestId: context.req.header('x-request-id') ?? undefined,
      tags: ['http'],
    });

    logger.error(
      {
        err: appError,
        error: appError.toLogObject(),
        method: context.req.method,
        path: context.req.path,
        status: appError.status,
      },
      'request failed',
    );

    return context.json(
      appError.toProblem(env.NODE_ENV, {
        instance: context.req.path,
      }),
      appError.status,
    );
  });

  app.on(['POST', 'GET'], '/api/auth/*', async (context) => {
    return auth.handler(context.req.raw);
  });

  return app;
};

export const app = createApp();
