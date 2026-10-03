'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ReviewBooking } from '@/components/ReviewBooking';
import { PageSkeleton } from '@/components/Skeleton';
import {
  bookingGuard,
  useBookingStore,
  useStoreHydrated,
} from '@/stores/booking';

export default function ReviewPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const state = useBookingStore();
  const redirect = hydrated ? bookingGuard(state, 'review') : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (
    !hydrated ||
    redirect ||
    !state.search ||
    !state.outbound ||
    !state.details
  )
    return <PageSkeleton />;
  return (
    <ReviewBooking
      search={state.search}
      choices={
        state.inbound ? [state.outbound, state.inbound] : [state.outbound]
      }
      details={state.details}
    />
  );
}
