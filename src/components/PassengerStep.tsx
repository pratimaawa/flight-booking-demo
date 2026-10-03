'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues } from 'react-hook-form';

import { COUNTRIES } from '@/lib/countries';
import { PAX_LABEL } from '@/lib/format';
import {
  bookingFormSchema,
  type BookingFormValues,
} from '@/lib/schemas/passengers';
import { toSearchParams, type Search } from '@/lib/schemas/search';
import { passengerTypes, travelDates, useTripLegs } from '@/lib/trip';
import { useBookingStore, type LegChoice } from '@/stores/booking';

import { Field } from './Field';
import { TripSummary } from './TripSummary';

const TITLES = {
  adult: ['Mr', 'Ms', 'Mrs'],
  child: ['Mstr', 'Miss'],
  infant: ['Mstr', 'Miss'],
} as const;

function emptyForm(search: Search): DefaultValues<BookingFormValues> {
  return {
    passengers: passengerTypes(search).map((type) => ({
      type,
      givenName: '',
      familyName: '',
      dob: '',
      nationality: '',
      passportNo: '',
      passportExpiry: '',
    })),
    contact: { email: '', phone: '' },
  };
}

export function PassengerStep({
  search,
  choices,
}: {
  search: Search;
  choices: LegChoice[];
}) {
  const router = useRouter();
  const draft = useBookingStore((s) => s.draft);
  const saveDraft = useBookingStore((s) => s.saveDraft);
  const saveDetails = useBookingStore((s) => s.saveDetails);
  const { legs } = useTripLegs(search, choices);
  const dates = travelDates(search);
  const schema = useMemo(
    () => bookingFormSchema(travelDates(search)),
    [search]
  );
  const {
    register,
    handleSubmit,
    subscribe,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: (draft ?? emptyForm(search)) as BookingFormValues,
  });

  // Persist as the user types, so a refresh doesn't lose their input.
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) =>
          saveDraft(values as DefaultValues<BookingFormValues>),
      }),
    [subscribe, saveDraft]
  );

  const onSubmit = handleSubmit((values) => {
    saveDetails(values);
    router.push('/book/review');
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <h1 className="text-xl font-semibold">Who&apos;s travelling?</h1>
        <p className="text-sm text-muted">
          Enter names exactly as they appear on each passport.
        </p>

        {passengerTypes(search).map((type, i) => {
          const e = errors.passengers?.[i];
          return (
            <fieldset key={i} className="grid gap-4 card sm:grid-cols-2">
              <legend className="px-1 font-semibold">
                Passenger {i + 1} · {PAX_LABEL[type]}
              </legend>
              <input type="hidden" {...register(`passengers.${i}.type`)} />
              <Field label="Title" error={e?.title?.message}>
                {(p) => (
                  <select
                    className="input"
                    {...p}
                    {...register(`passengers.${i}.title`)}
                  >
                    <option value="">Select</option>
                    {TITLES[type].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Nationality" error={e?.nationality?.message}>
                {(p) => (
                  <select
                    className="input"
                    {...p}
                    {...register(`passengers.${i}.nationality`)}
                  >
                    <option value="">Select</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Given names" error={e?.givenName?.message}>
                {(p) => (
                  <input
                    className="input"
                    autoComplete="given-name"
                    {...p}
                    {...register(`passengers.${i}.givenName`)}
                  />
                )}
              </Field>
              <Field label="Family name" error={e?.familyName?.message}>
                {(p) => (
                  <input
                    className="input"
                    autoComplete="family-name"
                    {...p}
                    {...register(`passengers.${i}.familyName`)}
                  />
                )}
              </Field>
              <Field label="Date of birth" error={e?.dob?.message}>
                {(p) => (
                  <input
                    type="date"
                    max={dates.departDate}
                    className="input"
                    {...p}
                    {...register(`passengers.${i}.dob`)}
                  />
                )}
              </Field>
              <Field label="Passport number" error={e?.passportNo?.message}>
                {(p) => (
                  <input
                    className="input uppercase"
                    autoComplete="off"
                    {...p}
                    {...register(`passengers.${i}.passportNo`)}
                  />
                )}
              </Field>
              <Field label="Passport expiry" error={e?.passportExpiry?.message}>
                {(p) => (
                  <input
                    type="date"
                    min={dates.lastDate}
                    className="input"
                    {...p}
                    {...register(`passengers.${i}.passportExpiry`)}
                  />
                )}
              </Field>
            </fieldset>
          );
        })}

        <fieldset className="grid gap-4 card sm:grid-cols-2">
          <legend className="px-1 font-semibold">Contact details</legend>
          <Field label="Email" error={errors.contact?.email?.message}>
            {(p) => (
              <input
                type="email"
                className="input"
                autoComplete="email"
                {...p}
                {...register('contact.email')}
              />
            )}
          </Field>
          <Field label="Phone" error={errors.contact?.phone?.message}>
            {(p) => (
              <input
                type="tel"
                className="input"
                autoComplete="tel"
                {...p}
                {...register('contact.phone')}
              />
            )}
          </Field>
        </fieldset>

        <div className="flex flex-wrap justify-between gap-3">
          <Link
            href={`/flights?${toSearchParams(search)}`}
            className="btn-secondary"
          >
            Back to flights
          </Link>
          <button type="submit" className="btn-primary">
            Continue to review
          </button>
        </div>
      </form>
      <aside>
        <TripSummary search={search} legs={legs} />
      </aside>
    </div>
  );
}
