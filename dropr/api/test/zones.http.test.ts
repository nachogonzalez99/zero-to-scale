import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

describe('zones endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists every coverage zone', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones' });

    expect(res.statusCode).toBe(200);
    const body: { items: { id: string }[] } = res.json();
    expect(body.items.map((zone) => zone.id)).toEqual(['madrid', 'barcelona', 'valencia']);
  });

  it('returns a zone with its pricing', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/madrid' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: 'madrid',
      name: 'Madrid',
      center: { lat: 40.4168, lng: -3.7038 },
      radiusMeters: 8000,
      timeZone: 'Europe/Madrid',
      baseFeeCents: 199,
      perKmCents: 60,
      peakSurchargeCents: 100,
      freeDeliveryFromCents: 3000,
    });
  });

  it('returns 404 as a problem for an unknown zone', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/paris' });

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({ status: 404, code: 'ZONE_NOT_FOUND' });
  });

  it('rejects a malformed zone id', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/NOT_VALID!' });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      errors: [expect.objectContaining({ path: 'params.zoneId' })],
    });
  });
});
