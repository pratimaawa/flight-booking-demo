import type { z } from 'zod';

import {
  airportsSchema,
  bookingResponseSchema,
  priceSchema,
  searchResultSchema,
  type BookingRequest,
} from './schemas/api';
import { toSearchParams, type Search } from './schemas/search';
import type { FareId } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;

  constructor(status: number, code: string, body: unknown) {
    super(`${status} ${code}`);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function request<S extends z.ZodType>(
  url: string,
  schema: S,
  init?: RequestInit
) {
  const res = await fetch(url, init);
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code =
      body &&
      typeof body === 'object' &&
      'code' in body &&
      typeof body.code === 'string'
        ? body.code
        : 'HTTP_ERROR';
    throw new ApiError(res.status, code, body);
  }
  // Fail loudly on contract drift instead of rendering undefined.
  return schema.parse(body) as z.output<S>;
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  airports: (q: string) =>
    request(`/api/airports?q=${encodeURIComponent(q)}`, airportsSchema),
  search: (s: Search) =>
    request(`/api/flights/search?${toSearchParams(s)}`, searchResultSchema),
  price: (offerId: string, fareId: FareId) =>
    request(
      `/api/offers/${encodeURIComponent(offerId)}/price`,
      priceSchema,
      post({ fareId })
    ),
  book: (body: BookingRequest) =>
    request('/api/bookings', bookingResponseSchema, post(body)),
};
