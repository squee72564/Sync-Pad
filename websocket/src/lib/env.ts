import { z } from 'zod';

import { logger } from './logger.js';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  PERMIFY_HTTP_URL: z.url(),
  PERMIFY_GRPC_URL: z.string().min(1),
  PERMIFY_GRPC_INSECURE: z.stringbool().default(true),
  PERMIFY_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  PERMIFY_TENANT_ID: z.string().min(1).default('syncpad'),
  PERMIFY_SCHEMA_VERSION: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const exitWithValidationFailure = (): never => {
  logger.flush();
  process.exit(1);
};

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    return result.data;
  }

  for (const issue of result.error.issues) {
    logger.error(
      {
        code: issue.code,
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      },
      'invalid environment variable',
    );
  }

  logger.fatal(
    { issueCount: result.error.issues.length },
    'environment validation failed, exiting',
  );

  return exitWithValidationFailure();
};

export const env = Object.freeze(parseEnv());
