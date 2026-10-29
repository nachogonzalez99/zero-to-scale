import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { BuildInfo } from '../../shared/config.ts';
import type { Readiness } from '../../shared/readiness.ts';
import { HealthSchema } from './health.schemas.ts';

interface HealthRoutesOptions {
  info: BuildInfo;
  readiness: Readiness;
}

// Probes are for the platform, not for API clients:
// - hide: kept out of the public contract
// - logLevel warn: called every few seconds, so a log line per request would flood the logs
const probe = { logLevel: 'warn', schema: { hide: true } } as const;

export const healthRoutes: FastifyPluginCallbackZod<HealthRoutesOptions> = (
  app,
  { info, readiness },
  done,
) => {
  // Liveness: is the process alive? If not, the platform restarts it.
  app.get(
    '/health/live',
    { ...probe, schema: { ...probe.schema, response: { 200: HealthSchema } } },
    () => ({ status: 'ok' as const, ...info }),
  );

  // Readiness: can it take traffic? If not, the platform stops routing here, without restarting it.
  app.get(
    '/health/ready',
    { ...probe, schema: { ...probe.schema, response: { 200: HealthSchema, 503: HealthSchema } } },
    (_req, reply) => {
      if (readiness.isReady()) {
        return { status: 'ok' as const, ...info };
      }
      reply.code(503);
      return { status: 'shutting_down' as const, ...info };
    },
  );

  done();
};
