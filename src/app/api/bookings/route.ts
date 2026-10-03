import { currentFarePrice } from '@/lib/mock/offers';
import {
  bookingsByRequest,
  createBookingRef,
  pricingNow,
  simulateNetwork,
} from '@/lib/mock/server';
import { bookingRequestSchema } from '@/lib/schemas/api';

export async function POST(req: Request) {
  const body = bookingRequestSchema.safeParse(
    await req.json().catch(() => null)
  );
  if (!body.success)
    return Response.json({ code: 'INVALID_REQUEST' }, { status: 400 });
  const { requestId, legs } = body.data;
  await simulateNetwork();

  const existing = bookingsByRequest.get(requestId);
  if (existing) return Response.json({ ref: existing });

  const now = pricingNow();
  const current = legs.map((l) => ({
    ...l,
    price: currentFarePrice(l.offerId, l.fareId, now),
  }));
  if (current.some((l) => l.price === null))
    return Response.json({ code: 'OFFER_NOT_FOUND' }, { status: 404 });
  if (current.some((l, i) => l.price !== legs[i]!.price))
    return Response.json(
      { code: 'PRICE_CHANGED', legs: current },
      { status: 409 }
    );

  // ponytail: passenger age/passport rules are enforced client-side only; a real API re-validates.
  const ref = createBookingRef();
  bookingsByRequest.set(requestId, ref);
  return Response.json({ ref }, { status: 201 });
}
