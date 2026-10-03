import { useSyncExternalStore } from 'react';
import type { DefaultValues } from 'react-hook-form';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BookingForm, BookingFormValues } from '@/lib/schemas/passengers';
import { searchKey, toSearchParams, type Search } from '@/lib/schemas/search';
import type { Fare, FareId, Offer } from '@/lib/types';

export type LegChoice = { offerId: string; fareId: FareId };
export type BookedLeg = { offer: Offer; fare: Fare; price: number };
export type Confirmation = {
  ref: string;
  search: Search;
  legs: BookedLeg[];
  passengers: BookingForm['passengers'];
  contact: BookingForm['contact'];
  total: number;
};

// Only in-progress choices live here. Flight data stays in TanStack Query.
export type BookingState = {
  search: Search | null;
  searchKey: string | null;
  outbound: LegChoice | null;
  inbound: LegChoice | null;
  draft: DefaultValues<BookingFormValues> | null;
  details: BookingForm | null;
  lastBooking: Confirmation | null;
};

type Actions = {
  selectOutbound: (search: Search, choice: LegChoice) => void;
  selectInbound: (choice: LegChoice) => void;
  clearOutbound: () => void;
  saveDraft: (draft: DefaultValues<BookingFormValues>) => void;
  saveDetails: (details: BookingForm) => void;
  complete: (booking: Confirmation) => void;
};

const emptyBooking = {
  search: null,
  searchKey: null,
  outbound: null,
  inbound: null,
  draft: null,
  details: null,
} satisfies Omit<BookingState, 'lastBooking'>;

export const useBookingStore = create<BookingState & Actions>()(
  persist(
    (set) => ({
      ...emptyBooking,
      lastBooking: null,
      selectOutbound: (search, choice) =>
        set((s) => {
          const key = searchKey(search);
          const same = s.searchKey === key;
          return {
            search,
            searchKey: key,
            outbound: choice,
            inbound: null,
            draft: same ? s.draft : null,
            details: same ? s.details : null,
          };
        }),
      selectInbound: (choice) => set({ inbound: choice }),
      clearOutbound: () => set({ outbound: null, inbound: null }),
      saveDraft: (draft) => set({ draft }),
      saveDetails: (details) => set({ details, draft: details }),
      complete: (booking) => set({ ...emptyBooking, lastBooking: booking }),
    }),
    { name: 'flight-booking', storage: createJSONStorage(() => sessionStorage) }
  )
);

export function bookingGuard(
  state: Pick<BookingState, 'search' | 'outbound' | 'inbound' | 'details'>,
  step: 'passengers' | 'review'
): string | null {
  if (!state.search || !state.outbound) return '/';
  if (state.search.trip === 'return' && !state.inbound)
    return `/flights?${toSearchParams(state.search)}`;
  if (step === 'review' && !state.details) return '/book/passengers';
  return null;
}

// sessionStorage is client-only; render a skeleton until it has been read.
export function useStoreHydrated() {
  return useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false
  );
}
