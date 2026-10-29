import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { Problem } from '../../shared/problem.ts';
import { zones } from './zones.data.ts';
import { Zone, ZoneIdParams, ZoneList } from './zones.schemas.ts';

export const zonesRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get(
    '/v1/zones',
    {
      schema: {
        operationId: 'listZones',
        summary: 'List coverage zones',
        tags: ['zones'],
        response: { 200: ZoneList, 401: Problem },
      },
    },
    () => ({ items: zones }),
  );

  app.get(
    '/v1/zones/:zoneId',
    {
      schema: {
        operationId: 'getZone',
        summary: 'Get a coverage zone',
        tags: ['zones'],
        params: ZoneIdParams,
        response: { 200: Zone, 401: Problem, 404: Problem },
      },
    },
    (req, reply) => {
      const zone = zones.find((z) => z.id === req.params.zoneId);
      if (!zone) {
        reply.code(404);
        return {
          type: 'about:blank',
          title: 'Zone not found',
          status: 404,
          code: 'ZONE_NOT_FOUND',
        };
      }
      return zone;
    },
  );

  done();
};
