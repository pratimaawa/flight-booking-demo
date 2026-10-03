import { SearchForm } from '@/components/SearchForm';

export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold sm:text-3xl">Where to?</h1>
      <p className="mt-1 text-muted">
        Search fictional flights between real airports.
      </p>
      <div className="mt-6 card">
        <SearchForm />
      </div>
    </>
  );
}
