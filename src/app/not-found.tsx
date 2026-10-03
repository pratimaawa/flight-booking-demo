import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/" className="mt-4 btn-primary">
        Search flights
      </Link>
    </div>
  );
}
