import { buildApp } from './app.ts';
import { env } from './shared/config.ts';

const app = await buildApp();
await app.listen({ port: env.PORT, host: '0.0.0.0' });

// The platform sends SIGTERM to stop the container; Ctrl+C sends SIGINT.
// As PID 1, Node ignores both unless it handles them.
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
}

process.once('SIGTERM', (signal) => void shutdown(signal));
process.once('SIGINT', (signal) => void shutdown(signal));
