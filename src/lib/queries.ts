import { queryOptions } from '@tanstack/react-query';

import { api } from './api';
import { searchKey, type Search } from './schemas/search';
import type { FareId } from './types';

export const searchQueryOptions = (s: Search) =>
  queryOptions({
    queryKey: ['search', searchKey(s)] as const,
    queryFn: () => api.search(s),
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const airportsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['airports', q.trim().toLowerCase()] as const,
    queryFn: () => api.airports(q),
    staleTime: Infinity,
  });

// Always fresh: this is the "is the price still valid?" check before booking.
export const priceQueryOptions = (offerId: string, fareId: FareId) =>
  queryOptions({
    queryKey: ['price', offerId, fareId] as const,
    queryFn: () => api.price(offerId, fareId),
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
