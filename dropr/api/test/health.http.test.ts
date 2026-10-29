import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import type { BuildInfo } from '../src/shared/config.ts';
import { type Readiness, createReadiness } from '../src/shared/readiness.ts';
import { shutdown } from '../src/shared/shutdown.ts';

const INFO: BuildInfo = { version: '1.2.3', commit: 'abc1234', environment: 'staging' };

describe('health endpoints', () => {
  let app: FastifyInstance;
  let readiness: Readiness;

  afterEach(async () => {
    await app.close();
  });

  async function start(): Promise<void> {
    readiness = createReadiness();
    app = await buildApp({ logger: false, info: INFO, readiness });
  }

  it('reports liveness with what is running', async () => {
    await start();
    const res = await app.inject({ method: 'GET', url: '/health/live' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', ...INFO });
  });

  it('is ready until shutdown starts', async () => {
    await start();
    expect((await app.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(200);

    readiness.markShuttingDown();
    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ status: 'shutting_down', ...INFO });
  });

  it('stays alive while shutting down: not ready is not dead', async () => {
    await start();
    readiness.markShuttingDown();

    expect((await app.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
  });

  it('defaults to a local development build', async () => {
    app = await buildApp({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/health/live' });

    expect(res.json()).toEqual({
      status: 'ok',
      version: '0.0.0-dev',
      commit: 'unknown',
      environment: 'local',
    });
  });
});

describe('shutdown', () => {
  it('keeps serving during the drain, then closes', async () => {
    const readiness = createReadiness();
    const app = await buildApp({ logger: false, readiness });

    const pending = shutdown(app, { readiness, drainMs: 50, timeoutMs: 1000 });

    // During the drain: not ready, but real requests still work
    expect((await app.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(503);
    expect((await app.inject({ method: 'GET', url: '/v1/zones' })).statusCode).toBe(200);

    await expect(pending).resolves.toBe('closed');
  });

  it('gives up when closing takes longer than the timeout', async () => {
    const readiness = createReadiness();
    const app = await buildApp({ logger: false, readiness });
    // A close hook that never finishes, like a request that hangs
    app.addHook('onClose', () => new Promise<void>(() => undefined));

    await expect(shutdown(app, { readiness, drainMs: 0, timeoutMs: 20 })).resolves.toBe(
      'timed_out',
    );
  });
});
