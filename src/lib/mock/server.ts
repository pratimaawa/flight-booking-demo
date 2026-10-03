import type { Search } from '@/lib/schemas/search';
import type { SearchResult } from '@/lib/types';

import { generateOffers } from './offers';

export class MockOutage extends Error {}

export function searchFlights(s: Search): SearchResult {
  return {
    outbound: generateOffers({
      from: s.from,
      to: s.to,
      date: s.depart,
      cabin: s.cabin,
    }),
    inbound:
      s.trip === 'return' && s.return
        ? generateOffers({
            from: s.to,
            to: s.from,
            date: s.return,
            cabin: s.cabin,
          })
        : null,
  };
}

// Real-feeling latency and occasional outages; MOCK_NETWORK=off disables both.
export async function simulateNetwork({ failRate = 0 } = {}) {
  if (process.env.MOCK_NETWORK === 'off') return;
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 600));
  if (Math.random() < failRate) throw new MockOutage();
}

export const pricingNow = () =>
  process.env.MOCK_FREEZE_PRICES === '1' ? null : Date.now();

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function createBookingRef() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join('');
}

// ponytail: per-instance memory; a real backend would persist this.
export const bookingsByRequest = new Map<string, string>();
