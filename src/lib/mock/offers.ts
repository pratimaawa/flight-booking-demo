import type { Cabin, Fare, FareId, Offer, Segment } from '../types';
import { AIRLINES } from './airlines';
import { airportByCode, distanceKm, HUBS } from './airports';
import { hashString, int, mulberry32, pick } from './random';

export type LegQuery = { from: string; to: string; date: string; cabin: Cabin };

const CABIN_MULTIPLIER: Record<Cabin, number> = {
  economy: 1,
  premium: 1.8,
  business: 3.6,
};

const FARE_RULES: (Omit<Fare, 'price'> & { factor: number })[] = [
  {
    id: 'saver',
    name: 'Saver',
    factor: 1,
    baggageKg: 0,
    changeable: false,
    refundable: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    factor: 1.18,
    baggageKg: 23,
    changeable: true,
    refundable: false,
  },
  {
    id: 'flex',
    name: 'Flex',
    factor: 1.45,
    baggageKg: 32,
    changeable: true,
    refundable: true,
  },
];

export const DRIFT_WINDOW_MS = 5 * 60_000;

const toCents = (dollars: number) => Math.round(dollars) * 100;
const toLocalIso = (ms: number) => new Date(ms).toISOString().slice(0, 16);

// Ids encode the inputs, so any endpoint can regenerate the offer statelessly.
export const offerId = (q: LegQuery, index: number) =>
  [q.from, q.to, q.date, q.cabin, index].join('.');

export function parseOfferId(
  id: string
): { query: LegQuery; index: number } | null {
  const [from, to, date, cabin, index, extra] = id.split('.');
  if (
    !from ||
    !to ||
    !date ||
    !cabin ||
    index === undefined ||
    extra !== undefined
  )
    return null;
  if (!(cabin in CABIN_MULTIPLIER)) return null;
  const n = Number(index);
  if (!Number.isInteger(n) || n < 0) return null;
  return { query: { from, to, date, cabin: cabin as Cabin }, index: n };
}

export function generateOffers(q: LegQuery): Offer[] {
  const origin = airportByCode.get(q.from);
  const dest = airportByCode.get(q.to);
  if (!origin || !dest || q.from === q.to) return [];

  const rand = mulberry32(
    hashString([q.from, q.to, q.date, q.cabin].join('|'))
  );
  const directKm = distanceKm(origin, dest);
  const hubs = HUBS.filter((h) => h !== q.from && h !== q.to);

  return Array.from({ length: int(rand, 8, 14) }, (_, index): Offer => {
    const airline = pick(rand, AIRLINES);
    const stops =
      directKm < 1500 ? (rand() < 0.8 ? 0 : 1) : pick(rand, [0, 1, 1, 2]);
    const path = [q.from];
    for (let s = 0; s < stops; s++)
      path.push(
        pick(
          rand,
          hubs.filter((h) => !path.includes(h))
        )
      );
    path.push(q.to);

    let t =
      Date.parse(`${q.date}T00:00:00Z`) + int(rand, 5 * 60, 22 * 60) * 60_000;
    const segments: Segment[] = [];
    for (let s = 0; s < path.length - 1; s++) {
      const a = airportByCode.get(path[s]!)!;
      const b = airportByCode.get(path[s + 1]!)!;
      const durationMin = Math.round((distanceKm(a, b) / 800) * 60 + 35);
      const arrive = t + durationMin * 60_000;
      segments.push({
        from: a.code,
        to: b.code,
        departAt: toLocalIso(t),
        arriveAt: toLocalIso(arrive),
        durationMin,
        flightNo: `${airline.code}${int(rand, 100, 999)}`,
      });
      t = arrive + int(rand, 60, 240) * 60_000;
    }

    const first = segments[0]!;
    const last = segments.at(-1)!;
    const durationMin =
      (Date.parse(`${last.arriveAt}Z`) - Date.parse(`${first.departAt}Z`)) /
      60_000;
    const baseDollars =
      (directKm * 0.09 + 60) *
      CABIN_MULTIPLIER[q.cabin] *
      (stops === 0 ? 1.15 : 1 - 0.07 * stops) *
      (0.85 + rand() * 0.4);

    return {
      id: offerId(q, index),
      airline: airline.code,
      segments,
      stops,
      durationMin,
      fares: FARE_RULES.map(({ factor, ...rule }) => ({
        ...rule,
        price: toCents(baseDollars * factor),
      })),
    };
  });
}

// Current price for a fare. `now: null` disables drift (used by E2E runs).
export function currentFarePrice(
  id: string,
  fareId: FareId,
  now: number | null
): number | null {
  const parsed = parseOfferId(id);
  if (!parsed) return null;
  const offer = generateOffers(parsed.query)[parsed.index];
  const fare = offer?.fares.find((f) => f.id === fareId);
  if (!fare) return null;
  if (now === null) return fare.price;
  const r = mulberry32(
    hashString(`${id}|${fareId}|${Math.floor(now / DRIFT_WINDOW_MS)}`)
  )();
  const factor = r < 0.7 ? 1 : r < 0.85 ? 1.04 : 0.97;
  return toCents((fare.price / 100) * factor);
}
