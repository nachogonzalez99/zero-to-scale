import { buildApp } from './app.ts';
import { buildInfo, env } from './shared/config.ts';
import { createReadiness } from './shared/readiness.ts';
import { shutdown } from './shared/shutdown.ts';

const info = buildInfo(env);
const readiness = createReadiness();
const app = await buildApp({ logger: { level: env.LOG_LEVEL }, info, readiness });

await app.listen({ port: env.PORT, host: '0.0.0.0' });
app.log.info(info, 'Started');

// The platform sends SIGTERM to stop the container; Ctrl+C sends SIGINT.
// As PID 1, Node ignores both unless it handles them.
async function onSignal(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Shutting down');
  const result = await shutdown(app, {
    readiness,
    drainMs: env.SHUTDOWN_DRAIN_MS,
    timeoutMs: env.SHUTDOWN_TIMEOUT_MS,
  });
  if (result === 'timed_out') {
    app.log.error({ timeoutMs: env.SHUTDOWN_TIMEOUT_MS }, 'Shutdown timed out, forcing exit');
    process.exit(1);
  }
}

process.once('SIGTERM', (signal) => void onSignal(signal));
process.once('SIGINT', (signal) => void onSignal(signal));
