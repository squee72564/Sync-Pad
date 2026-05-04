import { createApp } from './app.js';
import { createApiDeps } from './bootstrap/deps.js';
import { env } from './lib/env.js';
import { startServer } from './lib/server.js';

const deps = createApiDeps(env);
const app = createApp(deps);

startServer({
  app,
  pool: deps.pool,
  env,
});
