import type { Metadata } from 'next';
import Link from 'next/link';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { Results } from '@/components/Results';
import { searchFlights } from '@/lib/mock/server';
import { searchQueryOptions } from '@/lib/queries';
import { parseSearch } from '@/lib/schemas/search';

export const metadata: Metadata = { title: 'Flights' };

export default async function FlightsPage({
  searchParams,
}: PageProps<'/flights'>) {
  const parsed = parseSearch(await searchParams);
  if (!parsed.success) {
    return (
      <div role="alert" className="card">
        <h1 className="text-xl font-semibold">This search isn&apos;t valid</h1>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {parsed.error.issues.map((i, n) => (
            <li key={n}>{i.message}</li>
          ))}
        </ul>
        <Link href="/" className="mt-4 btn-primary">
          New search
        </Link>
      </div>
    );
  }

  // Server renders the first page of results; the client cache takes over after hydration.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    ...searchQueryOptions(parsed.data),
    queryFn: () => searchFlights(parsed.data),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Results search={parsed.data} />
    </HydrationBoundary>
  );
}
