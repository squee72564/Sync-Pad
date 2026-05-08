import { createHocusPocusServer } from './app.js';
import { createWebsocketDeps } from './bootstrap/deps.js';
import { env } from './lib/env.js';
import { startServer } from './lib/server.js';

const deps = createWebsocketDeps(env);
const app = createHocusPocusServer(deps);

startServer({
  app,
  pool: deps.pool,
  env,
});
