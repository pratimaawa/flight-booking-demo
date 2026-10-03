import { describe, expect, it } from 'vitest';

import { ageOn, bookingFormSchema } from './passengers';

const dates = { departDate: '2026-11-01', lastDate: '2026-11-08' };
const adult = {
  type: 'adult',
  title: 'Ms',
  givenName: 'Asha',
  familyName: 'Gurung',
  dob: '1994-05-12',
  nationality: 'NP',
  passportNo: 'pa1234567',
  passportExpiry: '2034-01-01',
};
const form = (p: object) => ({
  passengers: [{ ...adult, ...p }],
  contact: { email: 'asha@example.com', phone: '+977 9800000000' },
});
const issues = (p: object) => {
  const r = bookingFormSchema(dates).safeParse(form(p));
  return r.success
    ? []
    : r.error.issues.map((i) => [i.path.join('.'), i.message]);
};

describe('passengers', () => {
  it('computes age on a date', () => {
    expect(ageOn('2000-05-10', '2026-05-09')).toBe(25);
    expect(ageOn('2000-05-10', '2026-05-10')).toBe(26);
  });

  it('accepts a valid adult and normalises the passport number', () => {
    const r = bookingFormSchema(dates).safeParse(form({}));
    expect(r.success).toBe(true);
    expect(r.data?.passengers[0]?.passportNo).toBe('PA1234567');
  });

  it.each([
    [
      { dob: '2015-01-01' },
      'passengers.0.dob',
      'Adults must be 12 or older on the travel date',
    ],
    [
      { type: 'child', title: 'Miss', dob: '2025-06-01' },
      'passengers.0.dob',
      'Children must be 2–11 on the travel date',
    ],
    [
      { type: 'infant', title: 'Mstr', dob: '2024-10-31' },
      'passengers.0.dob',
      'Infants must be under 2 on the travel date',
    ],
    [
      { dob: '2026-12-01' },
      'passengers.0.dob',
      'Date of birth must be before travel',
    ],
    [
      { passportExpiry: '2026-11-08' },
      'passengers.0.passportExpiry',
      'Passport must be valid after your last flight',
    ],
    [
      { givenName: 'आशा' },
      'passengers.0.givenName',
      'Use Latin letters as in your passport',
    ],
    [{ title: '' }, 'passengers.0.title', 'Select a title'],
  ])('rejects %o', (patch, path, message) => {
    expect(issues(patch)).toContainEqual([path, message]);
  });

  it('accepts an infant under 2 on the departure date', () => {
    expect(
      issues({ type: 'infant', title: 'Miss', dob: '2024-11-02' })
    ).toEqual([]);
  });

  it('reports date rules even while other fields are still empty', () => {
    expect(
      issues({
        givenName: '',
        title: '',
        nationality: '',
        passportNo: '',
        passportExpiry: '',
        type: 'infant',
        dob: '2023-06-01',
      })
    ).toContainEqual([
      'passengers.0.dob',
      'Infants must be under 2 on the travel date',
    ]);
  });
});
