import { describe, expect, it } from 'vitest';

import { legTotal, priceBreakdown } from './pricing';

describe('pricing', () => {
  it('applies passenger-type multipliers', () => {
    expect(legTotal(10000, { adults: 1, children: 0, infants: 0 })).toBe(10000);
    expect(legTotal(10000, { adults: 2, children: 1, infants: 1 })).toBe(28500);
  });

  it('splits totals into base and taxes', () => {
    expect(
      priceBreakdown([10000, 20000], { adults: 1, children: 0, infants: 0 })
    ).toEqual({
      base: 24600,
      taxes: 5400,
      total: 30000,
    });
  });
});
