import { describe, expect, it } from 'vitest';

import { generateOffers } from '../mock/offers';
import { searchResultSchema } from './api';

describe('api schemas', () => {
  it('accept what the mock generator produces', () => {
    const outbound = generateOffers({
      from: 'KTM',
      to: 'LHR',
      date: '2026-11-01',
      cabin: 'business',
    });
    expect(
      searchResultSchema.safeParse({ outbound, inbound: null }).success
    ).toBe(true);
  });

  it('reject malformed responses', () => {
    expect(
      searchResultSchema.safeParse({ outbound: [{ id: 1 }] }).success
    ).toBe(false);
  });
});
