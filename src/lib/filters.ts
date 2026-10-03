import type { Offer } from './types';

export type StopsFilter = '0' | '1' | '2';
export type TimeBand = 'morning' | 'afternoon' | 'evening' | 'night';
export type SortKey = 'best' | 'cheapest' | 'fastest';
export type Filters = {
  stops: StopsFilter[];
  airlines: string[];
  times: TimeBand[];
  maxPrice: number | null; // cents
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = {
  stops: [],
  airlines: [],
  times: [],
  maxPrice: null,
  sort: 'best',
};
const STOPS: StopsFilter[] = ['0', '1', '2'];
const TIMES: TimeBand[] = ['morning', 'afternoon', 'evening', 'night'];

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
const oneOf =
  <T extends string>(allowed: T[]) =>
  (v: string): v is T =>
    allowed.includes(v as T);

export function parseFilters(p: URLSearchParams): Filters {
  const sort = p.get('sort');
  const max = Number(p.get('max'));
  return {
    stops: list(p.get('stops')).filter(oneOf(STOPS)),
    airlines: list(p.get('airlines')),
    times: list(p.get('times')).filter(oneOf(TIMES)),
    maxPrice: Number.isFinite(max) && max > 0 ? max * 100 : null,
    sort: sort === 'cheapest' || sort === 'fastest' ? sort : 'best',
  };
}

export function filtersToParams(f: Filters, base: URLSearchParams) {
  const p = new URLSearchParams(base);
  const setList = (key: string, v: string[]) =>
    v.length ? p.set(key, v.join(',')) : p.delete(key);
  setList('stops', f.stops);
  setList('airlines', f.airlines);
  setList('times', f.times);
  if (f.maxPrice) p.set('max', String(Math.round(f.maxPrice / 100)));
  else p.delete('max');
  if (f.sort !== 'best') p.set('sort', f.sort);
  else p.delete('sort');
  return p;
}

export const minFare = (o: Offer) => Math.min(...o.fares.map((f) => f.price));

export function timeBand(iso: string): TimeBand {
  const h = Number(iso.slice(11, 13));
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

export const hasActiveFilters = (f: Filters) =>
  f.stops.length + f.airlines.length + f.times.length > 0 ||
  f.maxPrice !== null;

export function applyFilters(offers: Offer[], f: Filters): Offer[] {
  const kept = offers.filter(
    (o) =>
      (!f.stops.length ||
        f.stops.includes(String(Math.min(o.stops, 2)) as StopsFilter)) &&
      (!f.airlines.length || f.airlines.includes(o.airline)) &&
      (!f.times.length ||
        f.times.includes(timeBand(o.segments[0]!.departAt))) &&
      (f.maxPrice === null || minFare(o) <= f.maxPrice)
  );
  const cheapest = Math.min(...offers.map(minFare));
  const fastest = Math.min(...offers.map((o) => o.durationMin));
  const score = (o: Offer) => minFare(o) / cheapest + o.durationMin / fastest;
  const compare: Record<SortKey, (a: Offer, b: Offer) => number> = {
    cheapest: (a, b) =>
      minFare(a) - minFare(b) || a.durationMin - b.durationMin,
    fastest: (a, b) => a.durationMin - b.durationMin || minFare(a) - minFare(b),
    best: (a, b) => score(a) - score(b),
  };
  return kept.sort(compare[f.sort]);
}
