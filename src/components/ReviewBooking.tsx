'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueries } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { formatMoney, PAX_LABEL } from '@/lib/format';
import { priceBreakdown } from '@/lib/pricing';
import { priceQueryOptions } from '@/lib/queries';
import type { BookingForm } from '@/lib/schemas/passengers';
import { toSearchParams, type Search } from '@/lib/schemas/search';
import { paxCounts, useTripLegs } from '@/lib/trip';
import { useBookingStore, type LegChoice } from '@/stores/booking';

import { TripSummary } from './TripSummary';

export function ReviewBooking({
  search,
  choices,
  details,
}: {
  search: Search;
  choices: LegChoice[];
  details: BookingForm;
}) {
  const router = useRouter();
  const complete = useBookingStore((s) => s.complete);
  const { legs, missing } = useTripLegs(search, choices);
  const pax = paxCounts(search);

  // Re-check every leg's price right before booking, like a real booking engine.
  const priceQueries = useQueries({
    queries: choices.map((c) => priceQueryOptions(c.offerId, c.fareId)),
  });
  const current = priceQueries.every((q) => q.isSuccess)
    ? priceQueries.map((q) => q.data!.price)
    : null;
  const quoted = legs?.map((l) => l.fare.price) ?? null;
  const changed =
    !!current && !!quoted && current.some((p, i) => p !== quoted[i]);
  const [acceptedKey, setAcceptedKey] = useState<string | null>(null);
  const needsAccept = changed && acceptedKey !== current!.join();

  // One id per visit: retries and double clicks can't create two bookings.
  const [requestId] = useState(() => crypto.randomUUID());
  const book = useMutation({
    mutationFn: () =>
      api.book({
        requestId,
        legs: choices.map((c, i) => ({ ...c, price: current![i]! })),
        passengers: details.passengers,
        contact: details.contact,
      }),
    onSuccess: ({ ref }) => {
      complete({
        ref,
        search,
        legs: legs!.map((l, i) => ({ ...l, price: current![i]! })),
        passengers: details.passengers,
        contact: details.contact,
        total: priceBreakdown(current!, pax).total,
      });
      router.replace(`/book/confirmation/${ref}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'PRICE_CHANGED')
        priceQueries.forEach((q) => void q.refetch());
    },
  });
  const priceChangedError =
    book.error instanceof ApiError && book.error.code === 'PRICE_CHANGED';

  if (missing) {
    return (
      <div role="alert" className="card">
        <h1 className="text-xl font-semibold">
          This flight is no longer available
        </h1>
        <Link
          href={`/flights?${toSearchParams(search)}`}
          className="mt-4 btn-primary"
        >
          Choose another flight
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Review and confirm</h1>

        <section className="card">
          <h2 className="font-semibold">Travellers</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {details.passengers.map((p, i) => (
              <li key={i}>
                {p.title} {p.givenName} {p.familyName}{' '}
                <span className="text-muted">
                  · {PAX_LABEL[p.type]} · passport ending{' '}
                  {p.passportNo.slice(-3)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            Contact: {details.contact.email} · {details.contact.phone}
          </p>
          <Link
            href="/book/passengers"
            className="mt-3 inline-block text-sm text-brand underline"
          >
            Edit travellers
          </Link>
        </section>

        <div aria-live="polite" className="space-y-3">
          {priceQueries.some((q) => q.isError) && (
            <div role="alert" className="card">
              <p className="font-medium">
                We couldn&apos;t confirm the latest fare.
              </p>
              <button
                type="button"
                className="mt-3 btn-secondary"
                onClick={() =>
                  priceQueries.forEach((q) => q.isError && void q.refetch())
                }
              >
                Try again
              </button>
            </div>
          )}
          {needsAccept && quoted && current && (
            <div className="rounded-lg border border-line bg-warn-bg p-4 text-warn-fg">
              <p className="font-medium">
                Fare updated from{' '}
                {formatMoney(priceBreakdown(quoted, pax).total)} to{' '}
                {formatMoney(priceBreakdown(current, pax).total)}
              </p>
              <p className="text-sm">
                Airline prices change often. Accept the new fare to continue.
              </p>
              <button
                type="button"
                className="mt-3 btn-primary"
                onClick={() => setAcceptedKey(current.join())}
              >
                Accept new fare
              </button>
            </div>
          )}
          {book.isError && !priceChangedError && (
            <p role="alert" className="error">
              Booking failed. Please try again.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <Link href="/book/passengers" className="btn-secondary">
            Back
          </Link>
          <button
            type="button"
            className="btn-primary"
            disabled={!current || needsAccept || book.isPending}
            onClick={() => book.mutate()}
          >
            {book.isPending
              ? 'Confirming…'
              : current
                ? 'Confirm booking'
                : 'Checking fare…'}
          </button>
        </div>
      </div>
      <aside>
        <TripSummary
          search={search}
          legs={legs}
          prices={current ?? undefined}
        />
      </aside>
    </div>
  );
}
