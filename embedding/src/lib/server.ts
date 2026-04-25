import { env } from './env.js';
import { logger } from './logger.js';

let shutdownPromise: Promise<never> | undefined;

const flushLogger = () =>
  new Promise<void>((resolve) => {
    logger.flush(() => {
      resolve();
    });
  });

export const shutdownWorker = (
  reason: string,
  options?: {
    error?: unknown;
    exitCode?: number;
  },
) => {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  const { error, exitCode = 0 } = options ?? {};

  shutdownPromise = (async () => {
    if (error) {
      logger.error({ err: error, reason }, 'shutting down embedding worker');
    } else {
      logger.info({ reason }, 'shutting down embedding worker');
    }

    await flushLogger();
    process.exit(exitCode);
  })();

  return shutdownPromise;
};

const registerProcessHandlers = () => {
  process.once('SIGINT', () => {
    void shutdownWorker('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdownWorker('SIGTERM');
  });

  process.once('uncaughtException', (error) => {
    void shutdownWorker('uncaughtException', {
      error,
      exitCode: 1,
    });
  });

  process.once('unhandledRejection', (reason) => {
    void shutdownWorker('unhandledRejection', {
      error:
        reason instanceof Error
          ? reason
          : new Error('Unhandled promise rejection'),
      exitCode: 1,
    });
  });
};

export const startWorker = () => {
  registerProcessHandlers();

  logger.info(
    {
      provider: env.EMBEDDING_PROVIDER,
      env: env.NODE_ENV,
    },
    'embedding worker ready',
  );
};
