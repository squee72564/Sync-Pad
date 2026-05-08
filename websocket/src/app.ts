import { Server } from '@hocuspocus/server';
import type { WebsocketDeps } from './bootstrap/deps.js';

export function createHocusPocusServer(deps: WebsocketDeps) {
  const { env } = deps;
  const server = new Server({
    port: env.PORT,
    quiet: env.NODE_ENV !== 'development',
  });

  return server;
}

export type WebsocketService = ReturnType<typeof createHocusPocusServer>;
