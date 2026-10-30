import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { NOW, PLACES } from './fixtures.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('POST /v1/quotes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false, clock: () => NOW });
  });

  afterAll(async () => {
    await app.close();
  });

  const postQuote = (payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/v1/quotes', payload });

  it('returns a quote', async () => {
    const res = await postQuote({
      pickup: PLACES.sol,
      dropoff: PLACES.bernabeu,
      orderAmountCents: 2000,
      deliveryAt: '2026-11-02T14:00:00+01:00',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      quoteId: expect.stringMatching(UUID),
      zoneId: 'madrid',
      distanceMeters: 4226,
      breakdown: {
        baseFeeCents: 199,
        distanceFeeCents: 254,
        peakSurchargeCents: 100,
        discountCents: 0,
      },
      totalCents: 553,
      currency: 'EUR',
      deliveryAt: '2026-11-02T13:00:00.000Z',
      expiresAt: '2026-11-02T09:10:00.000Z',
    });
  });

  it('uses the current time when no delivery time is given', async () => {
    const res = await postQuote({
      pickup: PLACES.sol,
      dropoff: PLACES.retiro,
      orderAmountCents: 0,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ deliveryAt: NOW.toISOString() });
  });

  it('rejects an invalid request with every validation error', async () => {
    const res = await postQuote({ pickup: { lat: 120, lng: 0 }, dropoff: PLACES.retiro });

    expect(res.statusCode).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'VALIDATION_ERROR',
    });
    const body: { errors: { path: string }[] } = res.json();
    expect(body.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(['body.pickup.lat', 'body.orderAmountCents']),
    );
  });

  it('rejects unknown fields', async () => {
    const res = await postQuote({
      pickup: PLACES.sol,
      dropoff: PLACES.retiro,
      orderAmountCents: 0,
      orderAmount: 10,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects a delivery time without offset', async () => {
    const res = await postQuote({
      pickup: PLACES.sol,
      dropoff: PLACES.retiro,
      orderAmountCents: 0,
      deliveryAt: '2026-11-02T14:00:00',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().errors).toEqual([expect.objectContaining({ path: 'body.deliveryAt' })]);
  });

  it('returns business rule violations as 422', async () => {
    const res = await postQuote({
      pickup: PLACES.sol,
      dropoff: PLACES.getafe,
      orderAmountCents: 0,
    });

    expect(res.statusCode).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toEqual({
      type: 'about:blank',
      title: 'Unprocessable Entity',
      status: 422,
      code: 'ZONE_NOT_COVERED',
      detail: 'The dropoff location is outside the Madrid delivery zone.',
    });
  });

  it('rejects malformed JSON', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/quotes',
      headers: { 'content-type': 'application/json' },
      payload: '{"pickup":',
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'MALFORMED_REQUEST' });
  });
});
