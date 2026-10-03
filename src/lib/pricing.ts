import type { PaxCounts } from './types';

export function legTotal(
  adultPrice: number,
  { adults, children, infants }: PaxCounts
) {
  return Math.round(adultPrice * (adults + children * 0.75 + infants * 0.1));
}

export function priceBreakdown(adultPrices: number[], pax: PaxCounts) {
  const total = adultPrices.reduce((sum, p) => sum + legTotal(p, pax), 0);
  const taxes = Math.round(total * 0.18);
  return { base: total - taxes, taxes, total };
}
