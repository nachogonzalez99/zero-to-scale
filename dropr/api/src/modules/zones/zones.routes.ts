import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { DomainError } from '../../shared/errors.ts';
import { commonErrorResponses, jsonResponse, problemResponse } from '../../shared/responses.ts';
import { ZONES, findZoneById } from './zones.ts';
import { ZoneIdParamsSchema, ZoneListSchema, ZoneSchema } from './zones.schemas.ts';

export const zonesRoutes: FastifyPluginCallbackZod = (app, _opts, done) => {
  app.get(
    '/v1/zones',
    {
      schema: {
        operationId: 'listZones',
        summary: 'List coverage zones',
        tags: ['zones'],
        response: {
          200: jsonResponse('All coverage zones.', ZoneListSchema),
          ...commonErrorResponses,
        },
      },
    },
    () => ({ items: [...ZONES] }),
  );

  app.get(
    '/v1/zones/:zoneId',
    {
      schema: {
        operationId: 'getZone',
        summary: 'Get a coverage zone',
        tags: ['zones'],
        params: ZoneIdParamsSchema,
        response: {
          200: jsonResponse('The zone.', ZoneSchema),
          400: problemResponse('The zone id is malformed.'),
          404: problemResponse('The zone does not exist.'),
          ...commonErrorResponses,
        },
      },
    },
    (req) => {
      const zone = findZoneById(req.params.zoneId);
      if (!zone) {
        throw new DomainError('ZONE_NOT_FOUND', `Zone '${req.params.zoneId}' does not exist.`);
      }
      return zone;
    },
  );

  done();
};
