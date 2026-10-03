import { useId } from 'react';

type FieldProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
};

// Wires label, input and error message together for screen readers.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (props: FieldProps) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="error">
          {error}
        </p>
      )}
    </div>
  );
}
