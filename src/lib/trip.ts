import { useQuery } from '@tanstack/react-query';

import type { LegChoice } from '@/stores/booking';

import { searchQueryOptions } from './queries';
import type { Search } from './schemas/search';
import type { Fare, Offer, PaxCounts } from './types';

export type TripLeg = { offer: Offer; fare: Fare };

export const paxCounts = (s: Search): PaxCounts => ({
  adults: s.adults,
  children: s.children,
  infants: s.infants,
});

export const travelDates = (s: Search) => ({
  departDate: s.depart,
  lastDate: s.trip === 'return' && s.return ? s.return : s.depart,
});

export const passengerTypes = (s: Search) => [
  ...Array<'adult'>(s.adults).fill('adult'),
  ...Array<'child'>(s.children).fill('child'),
  ...Array<'infant'>(s.infants).fill('infant'),
];

// Resolves stored choices against cached (or refetched, deterministic) search results.
export function useTripLegs(search: Search, choices: LegChoice[]) {
  const query = useQuery(searchQueryOptions(search));
  const resolved = query.data
    ? choices.map((c, i) => {
        const offers =
          (i === 0 ? query.data.outbound : query.data.inbound) ?? [];
        const offer = offers.find((o) => o.id === c.offerId);
        const fare = offer?.fares.find((f) => f.id === c.fareId);
        return offer && fare ? { offer, fare } : null;
      })
    : null;
  const complete = resolved?.every((l): l is TripLeg => l !== null) ?? false;
  return {
    legs: complete ? (resolved as TripLeg[]) : null,
    missing: !!resolved && !complete,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
