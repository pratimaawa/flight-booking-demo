'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PassengerStep } from '@/components/PassengerStep';
import { PageSkeleton } from '@/components/Skeleton';
import {
  bookingGuard,
  useBookingStore,
  useStoreHydrated,
} from '@/stores/booking';

export default function PassengersPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const state = useBookingStore();
  const redirect = hydrated ? bookingGuard(state, 'passengers') : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!hydrated || redirect || !state.search || !state.outbound)
    return <PageSkeleton />;
  return (
    <PassengerStep
      search={state.search}
      choices={
        state.inbound ? [state.outbound, state.inbound] : [state.outbound]
      }
    />
  );
}
