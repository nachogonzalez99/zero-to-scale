import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

describe('zones', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists coverage zones', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones' });

    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBeGreaterThan(0);
  });

  it('returns a zone by id', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/centro' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: 'centro' });
  });

  it('returns 404 with a problem body for an unknown zone', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/unknown' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 404, code: 'ZONE_NOT_FOUND' });
  });

  it('rejects a malformed zone id', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/zones/NOT_VALID!' });

    expect(res.statusCode).toBe(400);
  });
});
