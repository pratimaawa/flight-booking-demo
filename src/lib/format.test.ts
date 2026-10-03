import { describe, expect, it } from 'vitest';

import {
  addDays,
  dayDiff,
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
  paxLabel,
} from './format';

describe('format', () => {
  it('formats cents as whole US dollars', () => {
    expect(formatMoney(123400)).toBe('$1,234');
    expect(formatMoney(0)).toBe('$0');
  });

  it('formats durations', () => {
    expect(formatDuration(310)).toBe('5h 10m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats times and dates without time zones', () => {
    expect(formatTime('2026-11-01T08:35')).toBe('08:35');
    expect(formatDate('2026-11-01')).toBe('Sun 1 Nov');
  });

  it('does date math on ISO dates', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(dayDiff('2026-11-01T22:00', '2026-11-02T06:10')).toBe(1);
  });

  it('labels passenger counts', () => {
    expect(paxLabel({ adults: 2, children: 1, infants: 0 })).toBe(
      '2 adults, 1 child'
    );
    expect(paxLabel({ adults: 1, children: 0, infants: 1 })).toBe(
      '1 adult, 1 infant'
    );
  });
});
