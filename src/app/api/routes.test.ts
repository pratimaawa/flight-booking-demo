import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentFarePrice, generateOffers } from '@/lib/mock/offers';
import { searchFlights } from '@/lib/mock/server';
import { parseSearch } from '@/lib/schemas/search';

import { GET as airportsGET } from './airports/route';
import { POST as bookingsPOST } from './bookings/route';
import { GET as searchGET } from './flights/search/route';
import { POST as pricePOST } from './offers/[id]/price/route';

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const offer = generateOffers({
  from: 'KTM',
  to: 'DXB',
  date: '2026-11-01',
  cabin: 'economy',
})[0]!;
const passenger = {
  type: 'adult',
  title: 'Ms',
  givenName: 'Asha',
  familyName: 'Gurung',
  dob: '1994-05-12',
  nationality: 'NP',
  passportNo: 'PA1234567',
  passportExpiry: '2034-01-01',
};
const contact = { email: 'asha@example.com', phone: '+977 9800000000' };

afterEach(() => vi.useRealTimers());

describe('searchFlights', () => {
  it('returns inbound only for return trips', () => {
    const s = parseSearch({
      from: 'KTM',
      to: 'DXB',
      trip: 'oneway',
      depart: '2026-11-01',
      adults: '1',
    }).data!;
    expect(searchFlights(s).inbound).toBeNull();
    expect(
      searchFlights({ ...s, trip: 'return', return: '2026-11-08' }).inbound
        ?.length
    ).toBeGreaterThan(0);
  });
});

describe('GET /api/airports', () => {
  it('searches airports', async () => {
    const res = await airportsGET(new Request('http://t/api/airports?q=kath'));
    expect((await res.json())[0].code).toBe('KTM');
  });
});

describe('GET /api/flights/search', () => {
  it('rejects invalid searches with 400', async () => {
    const res = await searchGET(
      new Request('http://t/api/flights/search?from=KTM&to=KTM')
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('INVALID_SEARCH');
  });

  it('returns offers for a valid search', async () => {
    const res = await searchGET(
      new Request(
        'http://t/api/flights/search?from=KTM&to=DXB&trip=return&depart=2026-11-01&return=2026-11-08&adults=1'
      )
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.outbound.length).toBeGreaterThan(0);
    expect(body.inbound.length).toBeGreaterThan(0);
  });
});

describe('POST /api/offers/:id/price', () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  it('prices a known fare', async () => {
    const res = await pricePOST(
      new Request('http://t', json({ fareId: 'saver' })),
      ctx(offer.id)
    );
    expect(res.status).toBe(200);
    expect((await res.json()).price).toBeTypeOf('number');
  });

  it('404s unknown offers and 400s bad bodies', async () => {
    expect(
      (
        await pricePOST(
          new Request('http://t', json({ fareId: 'saver' })),
          ctx('nope')
        )
      ).status
    ).toBe(404);
    expect(
      (
        await pricePOST(
          new Request('http://t', json({ fareId: 'gold' })),
          ctx(offer.id)
        )
      ).status
    ).toBe(400);
  });
});

describe('POST /api/bookings', () => {
  const book = (price: number, requestId = crypto.randomUUID()) =>
    bookingsPOST(
      new Request(
        'http://t',
        json({
          requestId,
          legs: [{ offerId: offer.id, fareId: 'saver', price }],
          passengers: [passenger],
          contact,
        })
      )
    );

  it('books at the current price and is idempotent per requestId', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_800_000_000_000);
    const price = currentFarePrice(offer.id, 'saver', Date.now())!;
    const requestId = crypto.randomUUID();
    const first = await book(price, requestId);
    expect(first.status).toBe(201);
    const { ref } = await first.json();
    expect(ref).toMatch(/^[A-Z0-9]{6}$/);
    const replay = await book(price, requestId);
    expect(replay.status).toBe(200);
    expect((await replay.json()).ref).toBe(ref);
  });

  it('returns 409 with current prices when the fare changed', async () => {
    const res = await book(1);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('PRICE_CHANGED');
    expect(body.legs[0].price).toBeGreaterThan(1);
  });

  it('rejects invalid bodies', async () => {
    const res = await bookingsPOST(
      new Request('http://t', json({ requestId: 'x' }))
    );
    expect(res.status).toBe(400);
  });
});
