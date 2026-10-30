import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../src/app.ts';

describe('error handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    // Routes that fail on purpose, to exercise the central error handler.
    app.get('/test/unexpected', () => {
      throw new Error('database password is hunter2');
    });
    app.get(
      '/test/wrong-response',
      { schema: { response: { 200: z.object({ ok: z.boolean() }) } } },
      () => ({ ok: 'yes' }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns unknown routes as a 404 problem', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/nothing-here' });

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('hides the details of unexpected errors', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/unexpected' });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected error occurred.',
    });
    expect(res.body).not.toContain('hunter2');
  });

  it('turns a response that breaks its own schema into a 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/wrong-response' });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('rejects a content type the API cannot parse', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/quotes',
      headers: { 'content-type': 'application/xml' },
      payload: '<quote />',
    });

    expect(res.statusCode).toBe(415);
    expect(res.json()).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
  });
});
