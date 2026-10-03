import type { PaxCounts } from './types';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export const formatMoney = (cents: number) => money.format(cents / 100);

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Generated times carry no zone; we show them as-is (see README).
export const formatTime = (iso: string) => iso.slice(11, 16);

export const formatDate = (isoDate: string) =>
  dateFmt.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const dayDiff = (fromIso: string, toIso: string) =>
  Math.round(
    (Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`) -
      Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)) /
      86_400_000
  );

// Browser-local date, so users east of UTC can pick "today".
export const localToday = () => new Date().toLocaleDateString('en-CA');

export const CABIN_LABEL = {
  economy: 'Economy',
  premium: 'Premium Economy',
  business: 'Business',
} as const;

export const PAX_LABEL = {
  adult: 'Adult',
  child: 'Child',
  infant: 'Infant',
} as const;

export function paxLabel({ adults, children, infants }: PaxCounts) {
  const part = (n: number, one: string, many: string) =>
    n ? [`${n} ${n === 1 ? one : many}`] : [];
  return [
    ...part(adults, 'adult', 'adults'),
    ...part(children, 'child', 'children'),
    ...part(infants, 'infant', 'infants'),
  ].join(', ');
}
