import { z } from 'zod';

import { contactSchema, passengerSchema } from './passengers';

export const fareIdSchema = z.enum(['saver', 'standard', 'flex']);

const segmentSchema = z.object({
  from: z.string(),
  to: z.string(),
  departAt: z.string(),
  arriveAt: z.string(),
  durationMin: z.number(),
  flightNo: z.string(),
});

const fareSchema = z.object({
  id: fareIdSchema,
  name: z.string(),
  price: z.number().int(),
  baggageKg: z.number(),
  changeable: z.boolean(),
  refundable: z.boolean(),
});

export const offerSchema = z.object({
  id: z.string(),
  airline: z.string(),
  segments: z.array(segmentSchema).min(1),
  stops: z.number().int(),
  durationMin: z.number(),
  fares: z.array(fareSchema).min(1),
});

export const searchResultSchema = z.object({
  outbound: z.array(offerSchema),
  inbound: z.array(offerSchema).nullable(),
});

export const airportsSchema = z.array(
  z.object({
    code: z.string(),
    city: z.string(),
    name: z.string(),
    country: z.string(),
    lat: z.number(),
    lon: z.number(),
  })
);

export const priceSchema = z.object({
  offerId: z.string(),
  fareId: fareIdSchema,
  price: z.number().int(),
});

export const bookingRequestSchema = z.object({
  requestId: z.uuid(),
  legs: z.array(priceSchema).min(1).max(2),
  passengers: z.array(passengerSchema).min(1).max(9),
  contact: contactSchema,
});
export type BookingRequest = z.input<typeof bookingRequestSchema>;

export const bookingResponseSchema = z.object({
  ref: z.string().regex(/^[A-Z0-9]{6}$/),
});
