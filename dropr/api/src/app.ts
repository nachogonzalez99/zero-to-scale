import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { quotesRoutes } from './modules/quotes/quotes.routes.ts';
import { zonesRoutes } from './modules/zones/zones.routes.ts';
import { type Clock, systemClock } from './shared/clock.ts';
import { registerErrorHandling } from './shared/error-handler.ts';
import { buildInfo, parseEnv, type BuildInfo } from './shared/config.ts';
import { createReadiness, type Readiness } from './shared/readiness.ts';
import { healthRoutes } from './modules/health/health.routes.ts';

interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  /** Injected so tests can fix the current time. */
  clock?: Clock;
  /** What is running and where. Defaults to a local development build. */
  info?: BuildInfo;
  /** Shared with the shutdown logic, which turns it off. */
  readiness?: Readiness;
}

export async function buildApp({
  logger = true,
  clock = systemClock,
  info = buildInfo(parseEnv({})),
  readiness = createReadiness(),
}: AppOptions = {}) {
  const app = Fastify({ logger });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandling(app);

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: { title: 'Dropr API', version: '0.2.0', license: { name: 'Proprietary' } },
      components: {
        securitySchemes: {
          ApiKey: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
        },
      },
      security: [{ ApiKey: [] }],
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(healthRoutes, { info, readiness });
  await app.register(zonesRoutes);
  await app.register(quotesRoutes, { clock });

  return app;
}
