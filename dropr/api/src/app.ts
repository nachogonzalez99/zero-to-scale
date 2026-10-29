import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
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

interface AppOptions {
  logger?: boolean;
  /** Injected so tests can fix the current time. */
  clock?: Clock;
}

export async function buildApp({ logger = true, clock = systemClock }: AppOptions = {}) {
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

  await app.register(zonesRoutes);
  await app.register(quotesRoutes, { clock });

  return app;
}
