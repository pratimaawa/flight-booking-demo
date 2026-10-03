'use client';

import { useId, useState } from 'react';

import { minFare } from '@/lib/filters';
import { dayDiff, formatDuration, formatMoney, formatTime } from '@/lib/format';
import { airlineByCode } from '@/lib/mock/airlines';
import type { FareId, Offer } from '@/lib/types';

export function OfferCard({
  offer,
  onSelect,
}: {
  offer: Offer;
  onSelect: (fareId: FareId) => void;
}) {
  const [open, setOpen] = useState(false);
  const faresId = useId();
  const first = offer.segments[0]!;
  const last = offer.segments.at(-1)!;
  const airline = airlineByCode.get(offer.airline)?.name ?? offer.airline;
  const via = offer.segments.slice(1).map((s) => s.from);
  const stops =
    offer.stops === 0
      ? 'Direct'
      : `${offer.stops} stop${offer.stops > 1 ? 's' : ''} · ${via.join(', ')}`;

  return (
    <li className="card">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-36">
          <p className="font-medium">{airline}</p>
          <p className="font-mono text-xs text-muted">
            {offer.segments.map((s) => s.flightNo).join(' · ')}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Time iso={first.departAt} code={first.from} />
          <div className="flex-1 text-center text-xs text-muted">
            <p>{formatDuration(offer.durationMin)}</p>
            <div className="my-1 h-px bg-line" aria-hidden />
            <p>{stops}</p>
          </div>
          <Time
            iso={last.arriveAt}
            code={last.to}
            plusDays={dayDiff(first.departAt, last.arriveAt)}
          />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted">from, per adult</p>
          <p className="text-xl font-semibold">{formatMoney(minFare(offer))}</p>
          <button
            type="button"
            className="mt-2 btn-secondary"
            aria-expanded={open}
            aria-controls={faresId}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide fares' : 'View fares'}
          </button>
        </div>
      </div>
      {open && (
        <ul id={faresId} className="mt-4 grid gap-3 sm:grid-cols-3">
          {offer.fares.map((f) => (
            <li key={f.id} className="rounded-md border border-line p-3">
              <p className="font-medium">{f.name}</p>
              <p className="text-lg font-semibold">{formatMoney(f.price)}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>
                  {f.baggageKg
                    ? `${f.baggageKg} kg checked bag`
                    : 'Cabin bag only'}
                </li>
                <li>{f.changeable ? 'Changes allowed' : 'No changes'}</li>
                <li>{f.refundable ? 'Refundable' : 'Non-refundable'}</li>
              </ul>
              <button
                type="button"
                className="mt-3 btn-primary w-full"
                onClick={() => onSelect(f.id)}
              >
                Select {f.name}
                <span className="sr-only">
                  {' '}
                  fare, {airline} departing {formatTime(first.departAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Time({
  iso,
  code,
  plusDays = 0,
}: {
  iso: string;
  code: string;
  plusDays?: number;
}) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">
        {formatTime(iso)}
        {plusDays > 0 && (
          <sup
            className="ml-0.5 text-xs text-danger"
            title={`Arrives ${plusDays} day later`}
          >
            +{plusDays}
          </sup>
        )}
      </p>
      <p className="font-mono text-xs text-muted">{code}</p>
    </div>
  );
}
