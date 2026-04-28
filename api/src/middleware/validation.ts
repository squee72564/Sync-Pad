import type { Context, MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import type { ZodType } from 'zod';
import { ZodError, type z } from 'zod';

import { type AppVariables, VALIDATED_CONTEXT_KEY } from '../lib/context.js';
import { AppError } from '../lib/error.js';

type RequestSchemas<TParams, TQuery, TJson> = {
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
  json?: ZodType<TJson>;
};

export type Validated<TParams = never, TQuery = never, TJson = never> = {
  params: TParams;
  query: TQuery;
  json: TJson;
};

const normalizeIssues = (issues: z.core.$ZodIssue[]) =>
  issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

const toValidationError = (error: unknown) => {
  const zodError =
    error instanceof ZodError
      ? error
      : new ZodError([
          {
            code: 'custom',
            message: error instanceof Error ? error.message : 'Invalid request',
            path: [],
          },
        ]);

  return new AppError({
    cause: error,
    code: 'VALIDATION_FAILED',
    details: {
      issues: normalizeIssues(zodError.issues),
    },
    expose: true,
    message: 'Request validation failed',
    status: StatusCodes.BAD_REQUEST,
    userMessage: 'Request validation failed.',
  });
};

export const validateRequest = <TParams, TQuery, TJson>(
  schemas: RequestSchemas<TParams, TQuery, TJson>,
): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (context, next) => {
    try {
      const query = Object.fromEntries(new URL(context.req.url).searchParams);
      const parsed = {
        params: schemas.params
          ? schemas.params.parse(context.req.param())
          : undefined,
        query: schemas.query ? schemas.query.parse(query) : undefined,
        json: schemas.json
          ? schemas.json.parse(await context.req.json())
          : undefined,
      };

      context.set(VALIDATED_CONTEXT_KEY, parsed);
      await next();
    } catch (error) {
      throw toValidationError(error);
    }
  };
};

export const getValidated = <T>(
  context: Context<{ Variables: AppVariables }>,
) => context.get(VALIDATED_CONTEXT_KEY) as T;
