'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { PageSkeleton } from '@/components/Skeleton';
import { TripSummary } from '@/components/TripSummary';
import { useBookingStore, useStoreHydrated } from '@/stores/booking';

export default function ConfirmationPage() {
  const { ref } = useParams<{ ref: string }>();
  const hydrated = useStoreHydrated();
  const booking = useBookingStore((s) => s.lastBooking);

  if (!hydrated) return <PageSkeleton />;
  if (!booking || booking.ref !== ref) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Booking not available</h1>
        <p className="mt-2 text-muted">
          Demo bookings are kept only in this browser tab. Start a new search to
          make another.
        </p>
        <Link href="/" className="mt-4 btn-primary">
          New search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card text-center">
        <p className="text-sm text-muted">Booking confirmed</p>
        <h1 className="mt-1 font-mono text-4xl font-semibold tracking-widest">
          {booking.ref}
        </h1>
        <p className="mt-2 text-sm text-muted">
          In a real system a confirmation would go to {booking.contact.email}.
        </p>
      </div>
      <TripSummary
        search={booking.search}
        legs={booking.legs}
        prices={booking.legs.map((l) => l.price)}
      />
      <Link href="/" className="btn-secondary">
        Book another trip
      </Link>
    </div>
  );
}
