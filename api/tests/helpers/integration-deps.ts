import { createApiDeps } from '../../src/bootstrap/deps.js';
import { env } from '../../src/lib/env.js';

let deps: ReturnType<typeof createApiDeps> | undefined;

export const getIntegrationDeps = () => {
  deps ??= createApiDeps(env);
  return deps;
};

export const closeIntegrationDeps = async () => {
  await deps?.pool.end();
  deps = undefined;
};
