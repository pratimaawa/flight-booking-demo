import { describe, expect, it } from 'vitest';

import { parseSearch, searchFormSchema, toSearchParams } from './search';

const valid = {
  from: 'ktm',
  to: 'DXB',
  trip: 'return',
  depart: '2026-11-01',
  return: '2026-11-08',
  adults: '2',
  children: '1',
  infants: '1',
  cabin: 'economy',
};
const messages = (r: ReturnType<typeof parseSearch>) =>
  r.success ? [] : r.error.issues.map((i) => [i.path.join('.'), i.message]);

describe('search schema', () => {
  it('parses and normalises a valid return search', () => {
    const r = parseSearch(valid);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      from: 'KTM',
      adults: 2,
      children: 1,
      infants: 1,
    });
  });

  it('round-trips through URL params', () => {
    const r = parseSearch(valid);
    expect(parseSearch(toSearchParams(r.data!)).data).toEqual(r.data);
  });

  it('ignores an empty return date on one-way trips', () => {
    expect(parseSearch({ ...valid, trip: 'oneway', return: '' }).success).toBe(
      true
    );
    expect(
      toSearchParams(parseSearch({ ...valid, trip: 'oneway' }).data!).has(
        'return'
      )
    ).toBe(false);
  });

  it.each([
    [{ to: 'KTM' }, 'to', 'Destination must differ from origin'],
    [{ from: 'XXX' }, 'from', 'Choose an airport from the list'],
    [
      { return: '2026-10-30' },
      'return',
      'Return must be on or after departure',
    ],
    [{ return: '' }, 'return', 'Choose a return date'],
    [{ infants: '3' }, 'infants', 'Each infant needs an adult'],
    [{ adults: '6', children: '4' }, 'children', 'Up to 9 seated passengers'],
  ])('rejects %o', (patch, path, message) => {
    expect(messages(parseSearch({ ...valid, ...patch }))).toContainEqual([
      path,
      message,
    ]);
  });

  it('rejects garbage numbers from a hand-edited URL', () => {
    expect(
      parseSearch(
        new URLSearchParams(
          'from=KTM&to=DXB&trip=oneway&depart=2026-11-01&adults=abc'
        )
      ).success
    ).toBe(false);
  });

  it('does not reject past dates on the server schema (time zones)', () => {
    expect(
      parseSearch({ ...valid, depart: '2020-01-01', return: '2020-01-02' })
        .success
    ).toBe(true);
  });

  it('form schema rejects dates before the browser-local today', () => {
    const form = searchFormSchema('2026-11-01');
    expect(form.safeParse({ ...valid, depart: '2026-11-01' }).success).toBe(
      true
    );
    const r = form.safeParse({ ...valid, depart: '2026-10-31' });
    expect(r.error?.issues.map((i) => i.message)).toContain(
      'Departure cannot be in the past'
    );
  });
});

describe('impossible dates', () => {
  it.each(['2026-13-01', '2026-02-30', '2026-00-10'])('rejects %s', (d) => {
    const r = parseSearch({ ...valid, depart: d, trip: 'oneway', return: '' });
    expect(r.success).toBe(false);
  });
});

describe('friendly messages for hand-edited URLs', () => {
  it.each([
    [{ adults: 'abc' }, 'adults', 'Choose 1–9 adults'],
    [{ adults: '1.5' }, 'adults', 'Choose 1–9 adults'],
    [{ children: 'x' }, 'children', 'Choose 0–8 children'],
    [{ trip: undefined }, 'trip', 'Choose one-way or return'],
    [{ cabin: 'first' }, 'cabin', 'Choose a cabin class'],
  ])('%o', (patch, path, message) => {
    expect(messages(parseSearch({ ...valid, ...patch }))).toContainEqual([
      path,
      message,
    ]);
  });
});
