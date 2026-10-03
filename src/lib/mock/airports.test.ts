import { describe, expect, it } from 'vitest';

import {
  airportByCode,
  airportLabel,
  distanceKm,
  searchAirports,
} from './airports';

describe('airports', () => {
  it('finds by code first, then city/name', () => {
    expect(searchAirports('ktm')[0]?.code).toBe('KTM');
    expect(searchAirports('lon').map((a) => a.code)).toContain('LHR');
    expect(searchAirports('  ')).toEqual([]);
  });

  it('labels and measures', () => {
    expect(airportLabel('KTM')).toBe('Kathmandu (KTM)');
    const km = distanceKm(airportByCode.get('KTM')!, airportByCode.get('DEL')!);
    expect(km).toBeGreaterThan(700);
    expect(km).toBeLessThan(900);
  });
});
