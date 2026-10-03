import type { Airline } from '../types';

// All fictional.
export const AIRLINES: Airline[] = [
  { code: 'H7', name: 'Himal Air' },
  { code: 'S3', name: 'Saffron Airways' },
  { code: 'D6', name: 'Desert Falcon' },
  { code: 'M2', name: 'Monsoon Air' },
  { code: 'L5', name: 'Lotus Wings' },
  { code: 'N8', name: 'Northwind' },
  { code: 'C1', name: 'Coral Sky' },
  { code: 'A9', name: 'Aurora Jet' },
];

export const airlineByCode = new Map(AIRLINES.map((a) => [a.code, a]));
