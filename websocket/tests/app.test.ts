import { describe, expect, it } from 'vitest';

import { createHocusPocusServer } from '../src/app.js';

describe('createHocusPocusServer', () => {
  it('uses the websocket service port and quiet mode outside development', () => {
    const server = createHocusPocusServer({
      env: {
        PORT: 4321,
        NODE_ENV: 'test',
      },
    } as never);

    expect(server.configuration.port).toBe(4321);
    expect(server.configuration.quiet).toBe(true);

    void server.destroy();
  });

  it('keeps the Hocuspocus start screen enabled in development', () => {
    const server = createHocusPocusServer({
      env: {
        PORT: 1234,
        NODE_ENV: 'development',
      },
    } as never);

    expect(server.configuration.quiet).toBe(false);

    void server.destroy();
  });
});
