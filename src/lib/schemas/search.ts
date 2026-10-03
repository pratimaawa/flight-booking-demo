import { z } from 'zod';

import { airportByCode } from '@/lib/mock/airports';

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date');
const iata = z
  .string()
  .toUpperCase()
  .refine((c) => airportByCode.has(c), 'Choose an airport from the list');
const count = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

export const searchSchema = z
  .object({
    from: iata,
    to: iata,
    trip: z.enum(['oneway', 'return']),
    depart: isoDate,
    return: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      isoDate.optional()
    ),
    adults: count(1, 9),
    children: count(0, 8).default(0),
    infants: count(0, 9).default(0),
    cabin: z.enum(['economy', 'premium', 'business']).default('economy'),
  })
  .superRefine((s, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (s.from === s.to) issue('to', 'Destination must differ from origin');
    if (s.trip === 'return') {
      if (!s.return) issue('return', 'Choose a return date');
      else if (s.return < s.depart)
        issue('return', 'Return must be on or after departure');
    }
    if (s.adults + s.children > 9)
      issue('children', 'Up to 9 seated passengers');
    if (s.infants > s.adults) issue('infants', 'Each infant needs an adult');
  });

export type Search = z.infer<typeof searchSchema>;

// "Not in the past" is checked only in the browser, against the user's local date.
export const searchFormSchema = (today: string) =>
  searchSchema.superRefine((s, ctx) => {
    if (s.depart < today)
      ctx.addIssue({
        code: 'custom',
        path: ['depart'],
        message: 'Departure cannot be in the past',
      });
  });

type RawParams =
  URLSearchParams | Record<string, string | string[] | undefined>;

export function parseSearch(input: RawParams) {
  const entries =
    input instanceof URLSearchParams
      ? Object.fromEntries(input)
      : Object.fromEntries(
          Object.entries(input).map(([k, v]) => [
            k,
            Array.isArray(v) ? v[0] : v,
          ])
        );
  return searchSchema.safeParse(entries);
}

export function toSearchParams(s: Search) {
  const p = new URLSearchParams({
    from: s.from,
    to: s.to,
    trip: s.trip,
    depart: s.depart,
    adults: String(s.adults),
    children: String(s.children),
    infants: String(s.infants),
    cabin: s.cabin,
  });
  if (s.trip === 'return' && s.return) p.set('return', s.return);
  return p;
}

export const searchKey = (s: Search) => toSearchParams(s).toString();
