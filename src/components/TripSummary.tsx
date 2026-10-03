import { formatDate, formatMoney, formatTime, paxLabel } from '@/lib/format';
import { airlineByCode } from '@/lib/mock/airlines';
import { priceBreakdown } from '@/lib/pricing';
import type { Search } from '@/lib/schemas/search';
import { paxCounts, type TripLeg } from '@/lib/trip';

export function TripSummary({
  search,
  legs,
  prices,
}: {
  search: Search;
  legs: TripLeg[] | null;
  prices?: number[];
}) {
  if (!legs) return <div className="h-48 animate-pulse card" aria-hidden />;
  const pax = paxCounts(search);
  const b = priceBreakdown(prices ?? legs.map((l) => l.fare.price), pax);
  return (
    <div className="space-y-4 card lg:sticky lg:top-6">
      <h2 className="font-semibold">Your trip</h2>
      {legs.map(({ offer, fare }, i) => {
        const first = offer.segments[0]!;
        const last = offer.segments.at(-1)!;
        return (
          <div key={offer.id}>
            <p className="text-xs text-muted uppercase">
              {i === 0 ? 'Outbound' : 'Return'} · {formatDate(first.departAt)}
            </p>
            <p className="font-medium">
              {first.from} {formatTime(first.departAt)} → {last.to}{' '}
              {formatTime(last.arriveAt)}
            </p>
            <p className="text-sm text-muted">
              {airlineByCode.get(offer.airline)?.name} · {fare.name} ·{' '}
              {offer.stops === 0
                ? 'Direct'
                : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
            </p>
          </div>
        );
      })}
      <p className="border-t border-line pt-3 text-sm text-muted">
        {paxLabel(pax)}
      </p>
      <dl className="space-y-1 text-sm">
        <Row label="Base fare" value={formatMoney(b.base)} />
        <Row label="Taxes & fees" value={formatMoney(b.taxes)} />
        <Row label="Total" value={formatMoney(b.total)} strong />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? 'text-base font-semibold' : ''}`}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
