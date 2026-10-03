import type { Airport } from '../types';

export const AIRPORTS: Airport[] = [
  {
    code: 'KTM',
    city: 'Kathmandu',
    name: 'Tribhuvan International',
    country: 'NP',
    lat: 27.7,
    lon: 85.36,
  },
  {
    code: 'DEL',
    city: 'Delhi',
    name: 'Indira Gandhi International',
    country: 'IN',
    lat: 28.56,
    lon: 77.1,
  },
  {
    code: 'BOM',
    city: 'Mumbai',
    name: 'Chhatrapati Shivaji Maharaj International',
    country: 'IN',
    lat: 19.09,
    lon: 72.87,
  },
  {
    code: 'BLR',
    city: 'Bengaluru',
    name: 'Kempegowda International',
    country: 'IN',
    lat: 13.2,
    lon: 77.71,
  },
  {
    code: 'CCU',
    city: 'Kolkata',
    name: 'Netaji Subhas Chandra Bose International',
    country: 'IN',
    lat: 22.65,
    lon: 88.45,
  },
  {
    code: 'DAC',
    city: 'Dhaka',
    name: 'Hazrat Shahjalal International',
    country: 'BD',
    lat: 23.84,
    lon: 90.4,
  },
  {
    code: 'CMB',
    city: 'Colombo',
    name: 'Bandaranaike International',
    country: 'LK',
    lat: 7.18,
    lon: 79.88,
  },
  {
    code: 'PBH',
    city: 'Paro',
    name: 'Paro International',
    country: 'BT',
    lat: 27.4,
    lon: 89.42,
  },
  {
    code: 'MLE',
    city: 'Malé',
    name: 'Velana International',
    country: 'MV',
    lat: 4.19,
    lon: 73.53,
  },
  {
    code: 'DXB',
    city: 'Dubai',
    name: 'Dubai International',
    country: 'AE',
    lat: 25.25,
    lon: 55.36,
  },
  {
    code: 'AUH',
    city: 'Abu Dhabi',
    name: 'Zayed International',
    country: 'AE',
    lat: 24.43,
    lon: 54.65,
  },
  {
    code: 'DOH',
    city: 'Doha',
    name: 'Hamad International',
    country: 'QA',
    lat: 25.27,
    lon: 51.61,
  },
  {
    code: 'IST',
    city: 'Istanbul',
    name: 'Istanbul Airport',
    country: 'TR',
    lat: 41.26,
    lon: 28.74,
  },
  {
    code: 'BKK',
    city: 'Bangkok',
    name: 'Suvarnabhumi',
    country: 'TH',
    lat: 13.69,
    lon: 100.75,
  },
  {
    code: 'SIN',
    city: 'Singapore',
    name: 'Changi',
    country: 'SG',
    lat: 1.36,
    lon: 103.99,
  },
  {
    code: 'KUL',
    city: 'Kuala Lumpur',
    name: 'Kuala Lumpur International',
    country: 'MY',
    lat: 2.74,
    lon: 101.71,
  },
  {
    code: 'HKG',
    city: 'Hong Kong',
    name: 'Hong Kong International',
    country: 'HK',
    lat: 22.31,
    lon: 113.92,
  },
  {
    code: 'PVG',
    city: 'Shanghai',
    name: 'Pudong International',
    country: 'CN',
    lat: 31.14,
    lon: 121.81,
  },
  {
    code: 'PEK',
    city: 'Beijing',
    name: 'Capital International',
    country: 'CN',
    lat: 40.08,
    lon: 116.58,
  },
  {
    code: 'ICN',
    city: 'Seoul',
    name: 'Incheon International',
    country: 'KR',
    lat: 37.46,
    lon: 126.44,
  },
  {
    code: 'NRT',
    city: 'Tokyo',
    name: 'Narita International',
    country: 'JP',
    lat: 35.77,
    lon: 140.39,
  },
  {
    code: 'SYD',
    city: 'Sydney',
    name: 'Kingsford Smith',
    country: 'AU',
    lat: -33.94,
    lon: 151.18,
  },
  {
    code: 'MEL',
    city: 'Melbourne',
    name: 'Melbourne Airport',
    country: 'AU',
    lat: -37.67,
    lon: 144.84,
  },
  {
    code: 'LHR',
    city: 'London',
    name: 'Heathrow',
    country: 'GB',
    lat: 51.47,
    lon: -0.45,
  },
  {
    code: 'CDG',
    city: 'Paris',
    name: 'Charles de Gaulle',
    country: 'FR',
    lat: 49.01,
    lon: 2.55,
  },
  {
    code: 'FRA',
    city: 'Frankfurt',
    name: 'Frankfurt Airport',
    country: 'DE',
    lat: 50.04,
    lon: 8.56,
  },
  {
    code: 'AMS',
    city: 'Amsterdam',
    name: 'Schiphol',
    country: 'NL',
    lat: 52.31,
    lon: 4.76,
  },
  {
    code: 'JFK',
    city: 'New York',
    name: 'John F. Kennedy International',
    country: 'US',
    lat: 40.64,
    lon: -73.78,
  },
  {
    code: 'SFO',
    city: 'San Francisco',
    name: 'San Francisco International',
    country: 'US',
    lat: 37.62,
    lon: -122.38,
  },
  {
    code: 'YYZ',
    city: 'Toronto',
    name: 'Pearson International',
    country: 'CA',
    lat: 43.68,
    lon: -79.63,
  },
];

export const HUBS = [
  'DXB',
  'DOH',
  'IST',
  'SIN',
  'BKK',
  'DEL',
  'HKG',
  'FRA',
] as const;

export const airportByCode = new Map(AIRPORTS.map((a) => [a.code, a]));

export function airportLabel(code: string) {
  const a = airportByCode.get(code);
  return a ? `${a.city} (${a.code})` : code;
}

export function searchAirports(q: string, limit = 8): Airport[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const exact = (a: Airport) => Number(a.code.toLowerCase() === s);
  return AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().startsWith(s) ||
      a.city.toLowerCase().includes(s) ||
      a.name.toLowerCase().includes(s)
  )
    .sort((a, b) => exact(b) - exact(a))
    .slice(0, limit);
}

// Haversine great-circle distance.
export function distanceKm(a: Airport, b: Airport) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
