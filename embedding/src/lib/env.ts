import { z } from 'zod';

import { logger } from './logger.js';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  EMBEDDING_PROVIDER: z.string().min(1).default('placeholder'),
});

type Env = z.infer<typeof envSchema>;

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
