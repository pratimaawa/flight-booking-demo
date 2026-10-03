import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';

import { Providers } from './providers';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Flight Booking Demo',
    template: '%s · Flight Booking Demo',
  },
  description:
    'A search-to-booking flight flow built with Next.js, TanStack Query, Zustand, React Hook Form and Zod. All data is fictional.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh">
        <Providers>
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Link href="/" className="font-semibold">
                Flight Booking Demo
              </Link>
              <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                Fictional data · no real bookings
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
