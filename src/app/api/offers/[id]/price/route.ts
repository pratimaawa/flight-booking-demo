import { z } from 'zod';

import { currentFarePrice } from '@/lib/mock/offers';
import { pricingNow, simulateNetwork } from '@/lib/mock/server';
import { fareIdSchema } from '@/lib/schemas/api';

const bodySchema = z.object({ fareId: fareIdSchema });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success)
    return Response.json({ code: 'INVALID_REQUEST' }, { status: 400 });
  await simulateNetwork();
  const price = currentFarePrice(id, body.data.fareId, pricingNow());
  if (price === null)
    return Response.json({ code: 'OFFER_NOT_FOUND' }, { status: 404 });
  return Response.json({ offerId: id, fareId: body.data.fareId, price });
}
