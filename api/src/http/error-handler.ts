import type { ErrorHandler } from 'hono';

import { type AppVariables, REQUEST_ID_CONTEXT_KEY } from '../lib/context.js';
import { env } from '../lib/env.js';
import { toAppError } from '../lib/error.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorHandler<{ Variables: AppVariables }> = (
  error,
  context,
) => {
  const requestId = context.get(REQUEST_ID_CONTEXT_KEY);
  const appError = toAppError(error, {
    metadata: {
      method: context.req.method,
      path: context.req.path,
    },
    requestId,
    tags: ['http'],
  });

  logger.error(
    {
      err: appError,
      error: appError.toLogObject(),
      method: context.req.method,
      path: context.req.path,
      requestId,
      status: appError.status,
    },
    'request failed',
  );

  return context.json(
    appError.toProblem(env.NODE_ENV, {
      instance: context.req.path,
      requestId,
    }),
    appError.status,
  );
};
