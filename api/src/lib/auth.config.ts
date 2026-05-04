import { createDbClientAndPool } from '@syncpad/db';
import { createAuth } from './auth.js';
import { env } from './env.js';

const { client: db } = createDbClientAndPool(env.DATABASE_URL);

export const auth = createAuth({ db, env });
export default auth;
