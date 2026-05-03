import type { MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { StatusCodes } from 'http-status-codes';

import { REQUEST_ID_CONTEXT_KEY } from '../lib/context.js';
import { env } from '../lib/env.js';
import { ApiError } from '../lib/error.js';

const createErrorResponse = (
  status: StatusCodes.FORBIDDEN | StatusCodes.REQUEST_TOO_LONG,
  code: string,
  message: string,
  userMessage: string,
  instance: string,
  requestId?: string,
) => {
  const error = new ApiError({
    code,
    expose: true,
    message,
    requestId,
    status,
    userMessage,
  });

  return error.toProblem(env.NODE_ENV, {
    instance,
    requestId,
  });
};

export const securityHeaders = secureHeaders({
  // Avoid pinning browsers to HTTPS while local development still runs over HTTP.
  strictTransportSecurity:
    env.NODE_ENV === 'production'
      ? 'max-age=15552000; includeSubDomains'
      : false,
});

const isUnsafeMethod = (method: string) =>
  !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

const isFormLikeContentType = (contentType: string | undefined) => {
  if (!contentType) {
    return false;
  }

  return [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ].some((value) => contentType.toLowerCase().includes(value));
};

const createCsrfErrorResponse = (path: string, requestId?: string) =>
  createErrorResponse(
    StatusCodes.FORBIDDEN,
    'CSRF_VALIDATION_FAILED',
    `CSRF protection rejected request at ${path}`,
    'Request failed CSRF validation.',
    path,
    requestId,
  );

export const csrfProtection: MiddlewareHandler = async (context, next) => {
  if (!isUnsafeMethod(context.req.method)) {
    await next();
    return;
  }

  if (!isFormLikeContentType(context.req.header('content-type'))) {
    await next();
    return;
  }

  const origin = context.req.header('origin');
  const secFetchSite = context.req.header('sec-fetch-site');
  const requestOrigin = new URL(context.req.url).origin;

  const originAllowed = origin !== undefined && origin === requestOrigin;
  const secFetchSiteAllowed =
    secFetchSite === 'same-origin' || secFetchSite === 'none';

  if (!originAllowed && !secFetchSiteAllowed) {
    const error = createCsrfErrorResponse(
      context.req.path,
      context.get(REQUEST_ID_CONTEXT_KEY),
    );

    return context.json(error, StatusCodes.FORBIDDEN);
  }

  await next();
};

export const authBodyLimit = bodyLimit({
  maxSize: 1024 * 1024,
  onError: (context) => {
    const error = createErrorResponse(
      StatusCodes.REQUEST_TOO_LONG,
      'REQUEST_BODY_TOO_LARGE',
      `Request body exceeded auth route size limit at ${context.req.path}`,
      'Request body is too large.',
      context.req.path,
      context.get(REQUEST_ID_CONTEXT_KEY),
    );

    return context.json(error, StatusCodes.REQUEST_TOO_LONG);
  },
});

export const authSecurityMiddleware: MiddlewareHandler[] = [
  csrfProtection,
  authBodyLimit,
];
