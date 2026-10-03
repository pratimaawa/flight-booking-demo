import { beforeEach, describe, expect, it } from 'vitest';

import { parseSearch } from '@/lib/schemas/search';

import { bookingGuard, useBookingStore } from './booking';

const search = parseSearch({
  from: 'KTM',
  to: 'DXB',
  trip: 'return',
  depart: '2026-11-01',
  return: '2026-11-08',
  adults: '1',
}).data!;
const choice = {
  offerId: 'KTM.DXB.2026-11-01.economy.0',
  fareId: 'saver' as const,
};
const details = {
  passengers: [
    {
      type: 'adult' as const,
      title: 'Ms' as const,
      givenName: 'Asha',
      familyName: 'Gurung',
      dob: '1994-05-12',
      nationality: 'NP',
      passportNo: 'PA1234567',
      passportExpiry: '2034-01-01',
    },
  ],
  contact: { email: 'a@b.co', phone: '+977 9800000000' },
};

beforeEach(() => useBookingStore.setState(useBookingStore.getInitialState()));

describe('booking store', () => {
  it('resets the inbound leg when the outbound changes', () => {
    const s = useBookingStore.getState();
    s.selectOutbound(search, choice);
    s.selectInbound({ ...choice, offerId: 'DXB.KTM.2026-11-08.economy.1' });
    s.selectOutbound(search, { ...choice, fareId: 'flex' });
    expect(useBookingStore.getState().inbound).toBeNull();
  });

  it('keeps traveller details for the same search and drops them for a new one', () => {
    const s = useBookingStore.getState();
    s.selectOutbound(search, choice);
    s.saveDetails(details);
    s.selectOutbound(search, { ...choice, fareId: 'flex' });
    expect(useBookingStore.getState().details).toEqual(details);
    s.selectOutbound({ ...search, adults: 2 }, choice);
    expect(useBookingStore.getState().details).toBeNull();
  });

  it('clears the in-progress booking on completion', () => {
    const s = useBookingStore.getState();
    s.selectOutbound(search, choice);
    s.complete({
      ref: 'ABC123',
      search,
      legs: [],
      passengers: details.passengers,
      contact: details.contact,
      total: 1,
    });
    expect(useBookingStore.getState()).toMatchObject({
      search: null,
      outbound: null,
      details: null,
      lastBooking: { ref: 'ABC123' },
    });
  });
});

describe('bookingGuard', () => {
  const base = { search: null, outbound: null, inbound: null, details: null };

  it('sends empty sessions back to search', () => {
    expect(bookingGuard(base, 'passengers')).toBe('/');
  });

  it('sends return trips without an inbound leg back to results', () => {
    expect(
      bookingGuard({ ...base, search, outbound: choice }, 'passengers')
    ).toMatch(/^\/flights\?from=KTM/);
  });

  it('sends review without traveller details back to passengers', () => {
    const ready = { ...base, search, outbound: choice, inbound: choice };
    expect(bookingGuard(ready, 'passengers')).toBeNull();
    expect(bookingGuard(ready, 'review')).toBe('/book/passengers');
    expect(bookingGuard({ ...ready, details }, 'review')).toBeNull();
  });
});
