import { randomUUID } from 'node:crypto';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { Clock } from '../../shared/clock.ts';
import { commonErrorResponses, jsonResponse, problemResponse } from '../../shared/responses.ts';
import { calculateQuote } from './quotes.domain.ts';
import { QuoteRequestSchema, QuoteSchema } from './quotes.schemas.ts';

export const quotesRoutes: FastifyPluginCallbackZod<{ clock: Clock }> = (app, { clock }, done) => {
  app.post(
    '/v1/quotes',
    {
      schema: {
        operationId: 'createQuote',
        summary: 'Calculate a delivery quote',
        description:
          'Calculates the price of a delivery. Nothing is stored: the same request at the same time returns the same price.',
        tags: ['quotes'],
        body: QuoteRequestSchema,
        response: {
          200: jsonResponse('The calculated quote.', QuoteSchema),
          400: problemResponse('The request is invalid.'),
          422: problemResponse(
            'The delivery cannot be quoted: `ZONE_NOT_COVERED`, `DISTANCE_EXCEEDED` or `INVALID_DELIVERY_TIME`.',
          ),
          ...commonErrorResponses,
        },
      },
    },
    (req) => {
      const { deliveryAt, ...rest } = req.body;
      const quote = calculateQuote(
        { ...rest, ...(deliveryAt ? { deliveryAt: new Date(deliveryAt) } : {}) },
        clock(),
      );

      return {
        quoteId: randomUUID(),
        zoneId: quote.zoneId,
        distanceMeters: quote.distanceMeters,
        breakdown: quote.breakdown,
        totalCents: quote.totalCents,
        currency: 'EUR' as const,
        deliveryAt: quote.deliveryAt.toISOString(),
        expiresAt: quote.expiresAt.toISOString(),
      };
    },
  );

  done();
};
