'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { addDays, CABIN_LABEL, localToday } from '@/lib/format';
import {
  searchFormSchema,
  toSearchParams,
  type Search,
} from '@/lib/schemas/search';

import { AirportCombobox } from './AirportCombobox';
import { Field } from './Field';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => (
    <option key={n} value={n}>
      {n}
    </option>
  ));

const noSubscribe = () => () => {};

export function SearchForm({ initial }: { initial?: Search }) {
  const router = useRouter();
  // '' on the server and in the prerendered HTML; the browser's local date after hydration.
  const today = useSyncExternalStore(noSubscribe, localToday, () => '');
  const schema = useMemo(() => searchFormSchema(today), [today]);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: initial ?? {
      from: 'KTM',
      to: 'DXB',
      trip: 'return',
      depart: '',
      return: '',
      adults: 1,
      children: 0,
      infants: 0,
      cabin: 'economy',
    },
  });

  // Dates depend on the browser's "today", so fill them after hydration.
  useEffect(() => {
    if (!today || getValues('depart')) return;
    setValue('depart', addDays(today, 14));
    setValue('return', addDays(today, 21));
  }, [getValues, setValue, today]);

  const trip = useWatch({ control, name: 'trip' });
  const onSubmit = handleSubmit((data) =>
    router.push(`/flights?${toSearchParams(data)}`)
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <fieldset className="flex gap-6">
        <legend className="sr-only">Trip type</legend>
        {(['return', 'oneway'] as const).map((t) => (
          <label key={t} className="flex items-center gap-2">
            <input type="radio" value={t} {...register('trip')} />
            {t === 'return' ? 'Return' : 'One way'}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {(['from', 'to'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <AirportCombobox
                name={field.name}
                label={name === 'from' ? 'From' : 'To'}
                value={String(field.value ?? '')}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Departure date" error={errors.depart?.message}>
          {(p) => (
            <input
              type="date"
              min={today || undefined}
              className="input"
              {...p}
              {...register('depart')}
            />
          )}
        </Field>
        {trip === 'return' && (
          <Field label="Return date" error={errors.return?.message}>
            {(p) => (
              <input
                type="date"
                min={today || undefined}
                className="input"
                {...p}
                {...register('return')}
              />
            )}
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Adults (12+)" error={errors.adults?.message}>
          {(p) => (
            <select className="input" {...p} {...register('adults')}>
              {range(1, 9)}
            </select>
          )}
        </Field>
        <Field label="Children (2–11)" error={errors.children?.message}>
          {(p) => (
            <select className="input" {...p} {...register('children')}>
              {range(0, 8)}
            </select>
          )}
        </Field>
        <Field label="Infants (under 2)" error={errors.infants?.message}>
          {(p) => (
            <select className="input" {...p} {...register('infants')}>
              {range(0, 9)}
            </select>
          )}
        </Field>
        <Field label="Cabin" error={errors.cabin?.message}>
          {(p) => (
            <select className="input" {...p} {...register('cabin')}>
              {Object.entries(CABIN_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={isSubmitting}
      >
        Search flights
      </button>
    </form>
  );
}
