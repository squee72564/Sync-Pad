import { Hono } from 'hono';

export const healthRoute = new Hono().get('/health', (context) =>
  context.json({
    ok: true,
    timestamp: new Date().toISOString(),
  }),
);
