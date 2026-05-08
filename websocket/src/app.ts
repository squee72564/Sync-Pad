import { Server } from '@hocuspocus/server';
import type { WebsocketDeps } from './bootstrap/deps.js';
import { createServerHandlers } from './handlers/index.js';

export function createHocusPocusServer(deps: WebsocketDeps) {
  const { env, auth, permissionChecker, documentService } = deps;
  const server = new Server({
    port: env.PORT,
    quiet: env.NODE_ENV !== 'development',
    ...createServerHandlers({ auth, permissionChecker, documentService }),
  });

  return server;
}

export type WebsocketService = ReturnType<typeof createHocusPocusServer>;
