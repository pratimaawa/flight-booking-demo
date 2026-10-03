import { describe, expect, it } from 'vitest';

import {
  applyFilters,
  EMPTY_FILTERS,
  filtersToParams,
  parseFilters,
} from './filters';
import type { Offer } from './types';

const offer = (
  id: string,
  airline: string,
  stops: number,
  hour: number,
  price: number,
  durationMin: number
): Offer => ({
  id,
  airline,
  stops,
  durationMin,
  segments: [
    {
      from: 'KTM',
      to: 'DXB',
      departAt: `2026-11-01T${String(hour).padStart(2, '0')}:00`,
      arriveAt: '2026-11-01T23:00',
      durationMin,
      flightNo: `${airline}1`,
    },
  ],
  fares: [
    {
      id: 'saver',
      name: 'Saver',
      price,
      baggageKg: 0,
      changeable: false,
      refundable: false,
    },
  ],
});
const offers = [
  offer('a', 'H7', 0, 8, 45000, 300),
  offer('b', 'S3', 1, 14, 30000, 600),
  offer('c', 'H7', 2, 23, 20000, 900),
];

describe('filters', () => {
  it('round-trips through URL params and keeps search params', () => {
    const f = {
      stops: ['0', '1'] as const,
      airlines: ['H7'],
      times: ['morning'] as const,
      maxPrice: 40000,
      sort: 'fastest' as const,
    };
    const p = filtersToParams(
      { ...f, stops: [...f.stops], times: [...f.times] },
      new URLSearchParams('from=KTM')
    );
    expect(p.get('from')).toBe('KTM');
    expect(p.get('max')).toBe('400');
    expect(parseFilters(p)).toEqual({
      ...f,
      stops: ['0', '1'],
      times: ['morning'],
    });
  });

  it('ignores junk values', () => {
    expect(
      parseFilters(
        new URLSearchParams('stops=9&times=lunch&sort=random&max=-1')
      )
    ).toEqual(EMPTY_FILTERS);
  });

  it('filters by stops, airline, time band and price', () => {
    const ids = (f: Partial<typeof EMPTY_FILTERS>) =>
      applyFilters(offers, { ...EMPTY_FILTERS, ...f })
        .map((o) => o.id)
        .sort();
    expect(ids({ stops: ['2'] })).toEqual(['c']);
    expect(ids({ airlines: ['H7'] })).toEqual(['a', 'c']);
    expect(ids({ times: ['night'] })).toEqual(['c']);
    expect(ids({ maxPrice: 30000 })).toEqual(['b', 'c']);
  });

  it('sorts', () => {
    const order = (sort: typeof EMPTY_FILTERS.sort) =>
      applyFilters(offers, { ...EMPTY_FILTERS, sort }).map((o) => o.id);
    expect(order('cheapest')).toEqual(['c', 'b', 'a']);
    expect(order('fastest')).toEqual(['a', 'b', 'c']);
    expect(order('best')[0]).toBe('a');
  });
});
