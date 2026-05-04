import type { Context, MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { Auth } from '../lib/auth.js';
import {
  type AppVariables,
  CURRENT_USER_CONTEXT_KEY,
  SESSION_CONTEXT_KEY,
} from '../lib/context.js';
import { ApiError } from '../lib/error.js';
import type { AuthSession } from '../types/auth.js';

export function createAuthenticationMiddleware({ auth }: { auth: Auth }) {
  const getAuthSession = async (
    request: Request,
  ): Promise<AuthSession | null> => {
    const response = await auth.api.getSession({ headers: request.headers });

    if (!response) {
      return null;
    }

    return response;
  };

  const applyAuthSession = (
    context: Context<{ Variables: AppVariables }, string, object>,
    authSession: Awaited<ReturnType<typeof getAuthSession>>,
  ) => {
    context.set(SESSION_CONTEXT_KEY, authSession?.session ?? null);
    context.set(CURRENT_USER_CONTEXT_KEY, authSession?.user ?? null);
  };

  return {
    applyAuthSession,

    optionalAuth:
      (): MiddlewareHandler<{ Variables: AppVariables }> =>
      async (context, next) => {
        const authSession = await getAuthSession(context.req.raw);
        applyAuthSession(context, authSession);
        await next();
      },

    requireAuth:
      (): MiddlewareHandler<{ Variables: AppVariables }> =>
      async (context, next) => {
        const authSession = await getAuthSession(context.req.raw);

        if (!authSession) {
          throw new ApiError({
            code: 'UNAUTHENTICATED',
            expose: true,
            message: 'No valid session for request',
            status: StatusCodes.UNAUTHORIZED,
            title: 'Unauthorized',
            userMessage: 'Authentication is required.',
          });
        }

        applyAuthSession(context, authSession);
        await next();
      },
  };
}
