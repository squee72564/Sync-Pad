import type { MiddlewareHandler } from 'hono';

import { type AppVariables, REQUEST_ID_CONTEXT_KEY } from '../lib/context.js';
import { logger } from '../lib/logger.js';

export const requestLoggerMiddleware: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (context, next) => {
  const startedAt = Date.now();
  let completed = false;

  try {
    await next();
    completed = true;
  } finally {
    if (completed) {
      logger.info(
        {
          durationMs: Date.now() - startedAt,
          method: context.req.method,
          path: context.req.path,
          requestId: context.get(REQUEST_ID_CONTEXT_KEY),
          status: context.res.status,
        },
        'request completed',
      );
    }
  }
};
