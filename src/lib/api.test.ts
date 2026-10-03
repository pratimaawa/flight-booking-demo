import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError } from './api';

// A fresh Response per call: bodies can only be read once.
const respond = (status: number, body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status }))
  );

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('returns parsed data', async () => {
    respond(200, { offerId: 'x', fareId: 'saver', price: 100 });
    await expect(api.price('x', 'saver')).resolves.toEqual({
      offerId: 'x',
      fareId: 'saver',
      price: 100,
    });
  });

  it('throws ApiError with the server code', async () => {
    respond(409, { code: 'PRICE_CHANGED', legs: [] });
    await expect(api.price('x', 'saver')).rejects.toMatchObject({
      status: 409,
      code: 'PRICE_CHANGED',
    });
    await expect(api.price('x', 'saver')).rejects.toBeInstanceOf(ApiError);
  });

  it('throws when a 200 response has the wrong shape', async () => {
    respond(200, { price: 'free' });
    await expect(api.price('x', 'saver')).rejects.toThrow();
  });
});
