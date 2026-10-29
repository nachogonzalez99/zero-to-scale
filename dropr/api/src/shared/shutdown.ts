import type { FastifyInstance } from 'fastify';
import { setTimeout as sleep } from 'node:timers/promises';
import type { Readiness } from './readiness.ts';

interface ShutdownOptions {
  readiness: Readiness;
  drainMs: number;
  timeoutMs: number;
}

export type ShutdownResult = 'closed' | 'timed_out';

/**
 * 1. Readiness off: the platform stops sending new traffic.
 * 2. Keep serving for `drainMs`, while the platform notices.
 * 3. Close: stop accepting connections and wait for in-flight requests, at most `timeoutMs`.
 */
export async function shutdown(
  app: FastifyInstance,
  { readiness, drainMs, timeoutMs }: ShutdownOptions,
): Promise<ShutdownResult> {
  readiness.markShuttingDown();
  await sleep(drainMs);

  const closed = app.close().then((): ShutdownResult => 'closed');
  // unref: this timer alone must not keep the process alive once the app has closed
  const deadline = sleep(timeoutMs, 'timed_out' as const, { ref: false });
  return Promise.race([closed, deadline]);
}
