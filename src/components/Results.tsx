'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import {
  applyFilters,
  EMPTY_FILTERS,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  type Filters,
} from '@/lib/filters';
import { formatTime } from '@/lib/format';
import { airlineByCode } from '@/lib/mock/airlines';
import { searchQueryOptions } from '@/lib/queries';
import { searchKey, type Search } from '@/lib/schemas/search';
import type { FareId } from '@/lib/types';
import { useBookingStore } from '@/stores/booking';

import { FiltersPanel } from './FiltersPanel';
import { OfferCard } from './OfferCard';
import { SearchSummary } from './SearchSummary';
import { ResultsSkeleton } from './Skeleton';

export function Results({ search }: { search: Search }) {
  const router = useRouter();
  const params = useSearchParams();
  const filters = parseFilters(params);
  const query = useQuery(searchQueryOptions(search));
  const store = useBookingStore(
    useShallow((s) => ({
      selectedKey: s.searchKey,
      outbound: s.outbound,
      selectOutbound: s.selectOutbound,
      selectInbound: s.selectInbound,
      clearOutbound: s.clearOutbound,
    }))
  );

  const chosenOutbound =
    store.selectedKey === searchKey(search) ? store.outbound : null;
  const leg =
    search.trip === 'return' && chosenOutbound ? 'inbound' : 'outbound';
  const offers =
    (leg === 'outbound' ? query.data?.outbound : query.data?.inbound) ?? [];
  const visible = applyFilters(offers, filters);
  const outboundOffer = chosenOutbound
    ? query.data?.outbound.find((o) => o.id === chosenOutbound.offerId)
    : undefined;

  // Native history keeps filters in the URL without a server round trip.
  const setFilters = (next: Filters) =>
    window.history.replaceState(null, '', `?${filtersToParams(next, params)}`);

  function choose(offerId: string, fareId: FareId) {
    if (leg === 'outbound') {
      store.selectOutbound(search, { offerId, fareId });
      if (search.trip === 'oneway') router.push('/book/passengers');
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      store.selectInbound({ offerId, fareId });
      router.push('/book/passengers');
    }
  }

  return (
    <div className="space-y-6">
      <SearchSummary search={search} />

      {outboundOffer && (
        <div className="flex flex-wrap items-center justify-between gap-2 card">
          <p>
            <span className="text-muted">Outbound: </span>
            {airlineByCode.get(outboundOffer.airline)?.name} ·{' '}
            {formatTime(outboundOffer.segments[0]!.departAt)} →{' '}
            {formatTime(outboundOffer.segments.at(-1)!.arriveAt)}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={store.clearOutbound}
          >
            Change
          </button>
        </div>
      )}

      <h1 className="text-xl font-semibold">
        {leg === 'outbound'
          ? `Choose your flight to ${search.to}`
          : `Choose your return flight to ${search.from}`}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside>
          <details className="card" open>
            <summary className="cursor-pointer font-medium">
              Filters &amp; sort
            </summary>
            <div className="mt-4">
              <FiltersPanel
                offers={offers}
                filters={filters}
                onChange={setFilters}
              />
            </div>
          </details>
        </aside>

        <section aria-labelledby="results-count">
          <p
            id="results-count"
            aria-live="polite"
            className="mb-3 text-sm text-muted"
          >
            {query.isSuccess
              ? `${visible.length} of ${offers.length} flights`
              : 'Loading flights…'}
          </p>
          {query.isPending ? (
            <ResultsSkeleton />
          ) : query.isError ? (
            <div role="alert" className="card">
              <p className="font-medium">We couldn&apos;t load flights.</p>
              <p className="text-sm text-muted">
                This demo API fails now and then on purpose.
              </p>
              <button
                type="button"
                className="mt-3 btn-primary"
                onClick={() => query.refetch()}
              >
                Retry
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="card">
              <p className="font-medium">No flights match.</p>
              {hasActiveFilters(filters) ? (
                <button
                  type="button"
                  className="mt-3 btn-secondary"
                  onClick={() =>
                    setFilters({ ...EMPTY_FILTERS, sort: filters.sort })
                  }
                >
                  Clear filters
                </button>
              ) : (
                <p className="text-sm text-muted">
                  Try different dates or airports.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  onSelect={(fareId) => choose(o.id, fareId)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
