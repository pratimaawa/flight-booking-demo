import { z } from 'zod';

import { isoDate } from './search';

const name = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(40, 'Max 40 characters')
  .regex(/^[A-Za-z][A-Za-z '-]*$/, 'Use Latin letters as in your passport');

export const passengerSchema = z.object({
  type: z.enum(['adult', 'child', 'infant']),
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Mstr', 'Miss'], {
    message: 'Select a title',
  }),
  givenName: name,
  familyName: name,
  dob: isoDate,
  nationality: z.string().regex(/^[A-Z]{2}$/, 'Choose a nationality'),
  passportNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,9}$/, 'Use 6–9 letters or digits'),
  passportExpiry: isoDate,
});

export type Passenger = z.infer<typeof passengerSchema>;

export function ageOn(dob: string, on: string) {
  const [y1, m1, d1] = dob.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = on.split('-').map(Number) as [number, number, number];
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

export const contactSchema = z.object({
  email: z.email({ message: 'Enter a valid email' }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ]{6,14}$/, 'Enter a valid phone number'),
});

const isDate = (v: unknown): v is string => isoDate.safeParse(v).success;

export function bookingFormSchema(dates: {
  departDate: string;
  lastDate: string;
}) {
  return z
    .object({
      passengers: z.array(passengerSchema).min(1),
      contact: contactSchema,
    })
    .superRefine(
      (v, ctx) =>
        v.passengers.forEach((p, i) => {
          const issue = (field: string, message: string) =>
            ctx.addIssue({
              code: 'custom',
              path: ['passengers', i, field],
              message,
            });
          if (isDate(p.passportExpiry) && p.passportExpiry <= dates.lastDate)
            issue(
              'passportExpiry',
              'Passport must be valid after your last flight'
            );
          if (!isDate(p.dob)) return;
          if (p.dob > dates.departDate)
            return issue('dob', 'Date of birth must be before travel');
          const age = ageOn(p.dob, dates.departDate);
          if (p.type === 'adult' && age < 12)
            issue('dob', 'Adults must be 12 or older on the travel date');
          if (p.type === 'child' && (age < 2 || age > 11))
            issue('dob', 'Children must be 2–11 on the travel date');
          if (p.type === 'infant' && age >= 2)
            issue('dob', 'Infants must be under 2 on the travel date');
        }),
      // Run even while other fields are invalid, so date errors show as the user types.
      {
        when: (payload) =>
          Array.isArray((payload.value as { passengers?: unknown }).passengers),
      }
    );
}

export type BookingForm = z.output<ReturnType<typeof bookingFormSchema>>;
export type BookingFormValues = z.input<ReturnType<typeof bookingFormSchema>>;
