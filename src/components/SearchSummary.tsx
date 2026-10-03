import { CABIN_LABEL, formatDate, paxLabel } from '@/lib/format';
import type { Search } from '@/lib/schemas/search';
import { paxCounts } from '@/lib/trip';

import { SearchForm } from './SearchForm';

export function SearchSummary({ search }: { search: Search }) {
  const dates =
    formatDate(search.depart) +
    (search.trip === 'return' && search.return
      ? ` – ${formatDate(search.return)}`
      : '');
  return (
    <details className="card">
      <summary className="cursor-pointer">
        <span className="font-semibold">
          {search.from} → {search.to}
        </span>
        <span className="text-muted">
          {' '}
          · {dates} · {paxLabel(paxCounts(search))} ·{' '}
          {CABIN_LABEL[search.cabin]}
        </span>
        <span className="ml-2 text-brand underline">Modify search</span>
      </summary>
      <div className="mt-4">
        <SearchForm initial={search} />
      </div>
    </details>
  );
}
