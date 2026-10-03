'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="card">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again.</p>
      <button type="button" className="mt-4 btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
