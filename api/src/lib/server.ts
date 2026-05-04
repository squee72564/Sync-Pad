import { type ServerType, serve } from '@hono/node-server';
import type { DbPool } from '@syncpad/db';
import type { ApiService } from '../app.js';
import type { Env } from './env.js';
import { logger } from './logger.js';

let server: ServerType | undefined;
let shutdownPromise: Promise<never> | undefined;

const flushLogger = () =>
  new Promise<void>((resolve) => {
    logger.flush(() => {
      resolve();
    });
  });

const closeServer = (serverToClose: ServerType) =>
  new Promise<void>((resolve, reject) => {
    serverToClose.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

export const shutdownServer = (
  pool: DbPool,
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
      logger.error({ err: error, reason }, 'shutting down after runtime error');
    } else {
      logger.info({ reason }, 'shutting down server');
    }

    if (server) {
      await closeServer(server);
      server = undefined;
    }

    await pool.end();
    await flushLogger();

    process.exit(exitCode);
  })();

  return shutdownPromise;
};

const registerProcessHandlers = (pool: DbPool) => {
  process.once('SIGINT', () => {
    void shutdownServer(pool, 'SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdownServer(pool, 'SIGTERM');
  });

  process.once('uncaughtException', (error) => {
    void shutdownServer(pool, 'uncaughtException', {
      error,
      exitCode: 1,
    });
  });

  process.once('unhandledRejection', (reason) => {
    void shutdownServer(pool, 'unhandledRejection', {
      error:
        reason instanceof Error
          ? reason
          : new Error('Unhandled promise rejection'),
      exitCode: 1,
    });
  });
};

export const startServer = ({
  app,
  pool,
  env,
}: {
  app: ApiService;
  pool: DbPool;
  env: Env;
}) => {
  registerProcessHandlers(pool);

  server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      logger.info(
        {
          host: info.address,
          port: info.port,
        },
        'api server listening',
      );
    },
  );

  server.once('error', (error) => {
    void shutdownServer(pool, 'server_error', {
      error,
      exitCode: 1,
    });
  });

  return server;
};
