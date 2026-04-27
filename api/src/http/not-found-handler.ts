import type { NotFoundHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';

import { type AppVariables, REQUEST_ID_CONTEXT_KEY } from '../lib/context.js';
import { env } from '../lib/env.js';
import { AppError } from '../lib/error.js';

export const notFoundHandler: NotFoundHandler<{ Variables: AppVariables }> = (
  context,
) => {
  const error = new AppError({
    code: 'ROUTE_NOT_FOUND',
    expose: true,
    message: `No route matched ${context.req.method} ${context.req.path}`,
    requestId: context.get(REQUEST_ID_CONTEXT_KEY),
    status: StatusCodes.NOT_FOUND,
    userMessage: 'The requested resource was not found.',
  });

  return context.json(
    error.toProblem(env.NODE_ENV, {
      instance: context.req.path,
      requestId: context.get(REQUEST_ID_CONTEXT_KEY),
    }),
    error.status,
  );
};
