export function ResultsSkeleton() {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="h-28 animate-pulse card" />
      ))}
    </ul>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-1/3 animate-pulse rounded bg-line" />
      <div className="h-64 animate-pulse card" />
    </div>
  );
}
