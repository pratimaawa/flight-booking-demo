import { describe, expect, it } from 'vitest';

import {
  currentFarePrice,
  DRIFT_WINDOW_MS,
  generateOffers,
  offerId,
  parseOfferId,
} from './offers';

const q = {
  from: 'KTM',
  to: 'DXB',
  date: '2026-11-01',
  cabin: 'economy' as const,
};

describe('generateOffers', () => {
  it('is deterministic for the same query', () => {
    expect(generateOffers(q)).toEqual(generateOffers(q));
  });

  it('differs for a different date', () => {
    expect(generateOffers({ ...q, date: '2026-11-02' })).not.toEqual(
      generateOffers(q)
    );
  });

  it('returns nothing for identical or unknown airports', () => {
    expect(generateOffers({ ...q, to: 'KTM' })).toEqual([]);
    expect(generateOffers({ ...q, to: 'XXX' })).toEqual([]);
  });

  it('builds consistent itineraries', () => {
    const offers = generateOffers(q);
    expect(offers.length).toBeGreaterThanOrEqual(8);
    for (const o of offers) {
      expect(o.stops).toBe(o.segments.length - 1);
      expect(o.segments[0]!.from).toBe('KTM');
      expect(o.segments.at(-1)!.to).toBe('DXB');
      o.segments
        .slice(1)
        .forEach((s, i) => expect(s.from).toBe(o.segments[i]!.to));
      const minutes =
        (Date.parse(`${o.segments.at(-1)!.arriveAt}Z`) -
          Date.parse(`${o.segments[0]!.departAt}Z`)) /
        60_000;
      expect(o.durationMin).toBe(minutes);
      expect(o.fares.map((f) => f.id)).toEqual(['saver', 'standard', 'flex']);
      expect(o.fares[0]!.price).toBeLessThan(o.fares[2]!.price);
      o.fares.forEach((f) => expect(f.price % 100).toBe(0));
    }
  });

  it('round-trips offer ids', () => {
    const id = offerId(q, 3);
    expect(parseOfferId(id)).toEqual({ query: q, index: 3 });
    expect(parseOfferId('nonsense')).toBeNull();
    expect(parseOfferId('KTM.DXB.2026-11-01.first.1')).toBeNull();
  });
});

describe('currentFarePrice', () => {
  const offer = generateOffers(q)[0]!;
  const base = offer.fares[0]!.price;

  it('returns the base price when drift is off', () => {
    expect(currentFarePrice(offer.id, 'saver', null)).toBe(base);
  });

  it('is stable within a window and sometimes drifts across windows', () => {
    const t = 1_800_000_000_000;
    expect(currentFarePrice(offer.id, 'saver', t)).toBe(
      currentFarePrice(offer.id, 'saver', t + 1000)
    );
    const prices = Array.from({ length: 60 }, (_, i) =>
      currentFarePrice(offer.id, 'saver', t + i * DRIFT_WINDOW_MS)
    );
    expect(prices).toContain(base);
    expect(prices.some((p) => p !== base)).toBe(true);
  });

  it('rejects unknown offers and fares', () => {
    expect(
      currentFarePrice('KTM.DXB.2026-11-01.economy.999', 'saver', null)
    ).toBeNull();
    expect(currentFarePrice('garbage', 'saver', null)).toBeNull();
  });
});

describe('parseOfferId dates', () => {
  it('rejects ids with impossible dates instead of crashing later', () => {
    expect(parseOfferId('KTM.DXB.2026-13-01.economy.0')).toBeNull();
    expect(
      currentFarePrice('KTM.DXB.2026-13-01.economy.0', 'saver', null)
    ).toBeNull();
  });
});
