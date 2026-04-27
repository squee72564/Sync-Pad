process.env.NODE_ENV ??= 'test';
process.env.LOG_LEVEL ??= 'silent';
process.env.PORT ??= '3001';
process.env.DATABASE_URL ??=
  'postgres://postgres:postgres@127.0.0.1:5432/syncpad_test';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-value-123';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3001';
