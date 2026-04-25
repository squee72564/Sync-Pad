import { type ServerType, serve } from '@hono/node-server';
import { app } from '../app.js';
import { pool } from '../db/client.js';
import { env } from './env.js';
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

const registerProcessHandlers = () => {
  process.once('SIGINT', () => {
    void shutdownServer('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdownServer('SIGTERM');
  });

  process.once('uncaughtException', (error) => {
    void shutdownServer('uncaughtException', {
      error,
      exitCode: 1,
    });
  });

  process.once('unhandledRejection', (reason) => {
    void shutdownServer('unhandledRejection', {
      error:
        reason instanceof Error
          ? reason
          : new Error('Unhandled promise rejection'),
      exitCode: 1,
    });
  });
};

export const startServer = () => {
  registerProcessHandlers();

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
    void shutdownServer('server_error', {
      error,
      exitCode: 1,
    });
  });

  return server;
};
