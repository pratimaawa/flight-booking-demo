# Flight Booking Demo — Design Spec

_Date: 2026-10-03 · Author: Pratima Awa · Status: draft for review_

## 1. Purpose

A public showcase project that backs up the claims on Pratima's CV: complex booking flows, server-state management, form-heavy UIs, and frontend architecture.

**Audience:** recruiters and hiring engineers. **Success means:**

- A reviewer understands the project in under 5 minutes from the README and live demo.
- The code holds up when someone reads it closely.
- The search → book flow is complete, with nothing half-built.

**Hard rule:** no code, data, API shapes or branding from Onta Trips, Ouro Trips, Gurzu or any employer or client. Everything is written from scratch, and all data is fictional.

## 2. Scope

**In scope:** a one-way or return international flight journey: search → results → fare selection → passenger details → review → confirmation.

**Out of scope:** payments, seat maps, user accounts, B2B/agent features, multi-city trips, persistent database, i18n.

## 3. Screens and flow

| #   | Route                      | Purpose                                          |
| --- | -------------------------- | ------------------------------------------------ |
| 1   | `/`                        | Search form                                      |
| 2   | `/flights?…`               | Results, filters, sort, fare selection           |
| 3   | `/book/passengers`         | Passenger and contact details                    |
| 4   | `/book/review`             | Summary, price breakdown, fare re-check, confirm |
| 5   | `/book/confirmation/[ref]` | Booking reference and summary                    |

### 3.1 Search (`/`)

- Fields: origin, destination (airport autocomplete), trip type (one-way / return), departure date, return date, passengers (adults, children, infants), cabin (Economy, Premium Economy, Business).
- Dates use the native `<input type="date">`.
- Zod rules: origin ≠ destination; departure ≥ today; return ≥ departure (return trips only); adults 1–9; total adults + children ≤ 9; infants ≤ adults.
- Submitting navigates to `/flights` with the search encoded in the URL.

### 3.2 Results (`/flights`)

- **The URL is the single source of truth for search params.** Pages are shareable and bookmarkable, and back/forward works.
- First load is server-rendered. Results then hydrate into the TanStack Query cache.
- Filters: stops (0 / 1 / 2+), airlines, departure time band, max price. Sort: cheapest, fastest, best (a simple weighted score of price and duration).
- Filtering and sorting run on the client over cached data, with no refetch. Filter state is also kept in the URL.
- Loading skeletons, an inline error with Retry, and an empty state.
- Each offer expands to show 2–3 fares (Saver / Standard / Flex) with baggage and change rules.
- Return trips: pick the outbound flight, then the inbound flight, each with its own fare.
- Selecting a fare stores the selection and navigates to `/book/passengers`.

### 3.3 Passengers (`/book/passengers`)

- One block per traveller, generated from the passenger counts: title, given name, family name, date of birth, nationality, passport number and expiry.
- Rules by passenger type, using the departure date: adult ≥ 12, child 2–11, infant < 2. Passport must not expire before the return date (or departure date for one-way trips).
- A contact section (email, phone).
- Built with React Hook Form + Zod (`useFieldArray`). Validation runs on blur, and errors are announced to screen readers.
- The draft is persisted in Zustand (sessionStorage), so a refresh doesn't lose input.
- With no selected offer, the page redirects to `/`.

### 3.4 Review (`/book/review`)

- Shows the itinerary, passengers and a price breakdown (base fare, taxes, total).
- **Fare re-check before confirming:** call `POST /api/offers/[id]/price`. If the price changed, show "Fare updated from X to Y", and the user must accept before confirming.
- Confirm calls `POST /api/bookings`. On success it clears the booking draft and navigates to the confirmation page.

### 3.5 Confirmation (`/book/confirmation/[ref]`)

- Shows the booking reference (6 characters, e.g. `K7Q2XD`) and a summary.
- Bookings are held in server memory. If the reference is unknown (for example after a redeploy), the page says the booking has expired and links back to search.

## 4. Architecture

### 4.1 Stack

Next.js (App Router), React, TypeScript (strict), Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, `@hookform/resolvers`. Dates and currency use the native `Intl` APIs. HTTP uses `fetch`. There is no UI kit; components are hand-built.

Tooling: ESLint, Prettier (same config as the portfolio), Vitest, Playwright, GitHub Actions.

### 4.2 Layout

```
src/
  app/
    page.tsx
    flights/page.tsx
    book/passengers/page.tsx
    book/review/page.tsx
    book/confirmation/[ref]/page.tsx
    api/airports/route.ts
    api/flights/search/route.ts
    api/offers/[id]/price/route.ts
    api/bookings/route.ts
    error.tsx, not-found.tsx
  lib/
    mock/        airports, airlines, seeded offer generator, in-memory booking store
    schemas/     Zod schemas: search params, passengers, API responses
    api.ts       typed fetch helpers; responses parsed with Zod
    queries.ts   query keys and hooks
    format.ts    Intl helpers (money, duration, dates)
  stores/booking.ts
  components/
```

### 4.3 Mock backend

- **Data:** about 30 real IATA airports, mostly Asia and the Gulf plus a few in Europe, and about 8 **fictional** airlines.
- **Deterministic:** offers are generated from a PRNG seeded by `from|to|date|cabin`, so the same search always returns the same flights.
- **Realism:** each response is delayed by 300–900 ms, and about 5% of search requests fail with a 503. Fares drift by up to ±5% based on time, so a price re-check can return a different total.
- **Offer IDs** encode the inputs needed to regenerate the offer, so `/price` and `/bookings` need no stored search state.
- **Bookings** are stored in an in-memory `Map`, which is acceptable for a demo and documented in the README.

### 4.4 State ownership

| State                                     | Owner                    |
| ----------------------------------------- | ------------------------ |
| Search params, filters, sort              | URL                      |
| Server data (airports, offers, prices)    | TanStack Query           |
| Selected offer and fares, passenger draft | Zustand (sessionStorage) |
| Form field state and errors               | React Hook Form          |

Server data is never copied into Zustand.

## 5. Errors and accessibility

- Search: one automatic retry, then an inline error with a Retry button. `error.tsx` catches unexpected errors.
- An API response that fails Zod parsing is treated as an error, never rendered half-parsed.
- Expired or missing offer → back to search with a message.
- Accessibility: labels on all fields, `aria-describedby` linking errors, an `aria-live` region for result counts and fare updates, a keyboard-operable combobox for airports, visible focus, and `prefers-reduced-motion` respected.
- Responsive from 320px up.

## 6. Testing

- **Vitest:** search and passenger Zod rules, generator determinism (same seed gives the same output), the filter/sort functions, and money/duration formatting.
- **Playwright:** one happy path: search KTM → DXB, pick a fare, fill one adult, confirm, and see the booking reference.
- **CI (GitHub Actions):** type-check, lint, unit tests and build on every push. The E2E test runs locally (documented in the README).

## 7. Documentation and delivery

- README: pitch, live demo link, flow GIF, **Decisions & trade-offs** (URL state, server vs client fetching, Zustand scope, seeded mock with fare drift, what changes against a real GDS/NDC API), how to run it, and "all data is fictional".
- Repo `pratimaawa/flight-booking-demo` (public), deployed on Vercel.
- Built in committed increments (scaffold → search → results → booking → polish), each passing type-check, lint and tests.
- Afterwards: pin the repo, and add it to the portfolio work list with the live link.
