import type { ErrorHandler } from 'hono';

import { type AppVariables, REQUEST_ID_CONTEXT_KEY } from '../lib/context.js';
import type { Env } from '../lib/env.js';
import { toApiError } from '../lib/error.js';
import { logger } from '../lib/logger.js';

export function createErrorHandler(env: Env) {
  const errorHandler: ErrorHandler<{ Variables: AppVariables }> = (
    error,
    context,
  ) => {
    const requestId = context.get(REQUEST_ID_CONTEXT_KEY);
    const apiError = toApiError(error, {
      metadata: {
        method: context.req.method,
        path: context.req.path,
      },
      requestId,
      tags: ['http'],
    });

    logger.error(
      {
        err: apiError,
        error: apiError.toLogObject(),
        method: context.req.method,
        path: context.req.path,
        requestId,
        status: apiError.status,
      },
      'request failed',
    );

    return context.json(
      apiError.toProblem(env.NODE_ENV, {
        instance: context.req.path,
        requestId,
      }),
      apiError.status,
    );
  };

  return errorHandler;
}
