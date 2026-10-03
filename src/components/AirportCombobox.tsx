'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { airportLabel } from '@/lib/mock/airports';
import { airportsQueryOptions } from '@/lib/queries';

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  error?: string;
};

// ARIA 1.2 combobox: arrow keys move, Enter selects, Escape closes.
export function AirportCombobox({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
}: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const errorId = `${id}-error`;
  const [text, setText] = useState(value ? airportLabel(value) : '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const query = useDeferredValue(text);
  const { data = [], isPlaceholderData } = useQuery({
    ...airportsQueryOptions(query),
    enabled: open && query.trim().length > 0,
    placeholderData: keepPreviousData,
  });
  const showList = open && data.length > 0;
  // Suggestions can lag the input (deferred value, previous-query placeholder);
  // Enter must never pick a stale option.
  const fresh = query === text && !isPlaceholderData;

  function select(code: string) {
    onChange(code);
    setText(airportLabel(code));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, data.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && showList) {
      e.preventDefault();
      if (fresh && data[active]) select(data[active].code);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="input"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && data[active]
            ? `${listId}-${data[active].code}`
            : undefined
        }
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange('');
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          if (!value) setText('');
          onBlur?.();
        }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-line bg-surface py-1 shadow-lg"
        >
          {data.map((a, i) => (
            <li
              key={a.code}
              id={`${listId}-${a.code}`}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-baseline gap-2 px-3 py-2 ${i === active ? 'bg-bg' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(a.code);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="font-medium">{a.city}</span>
              <span className="truncate text-sm text-muted">{a.name}</span>
              <span className="ml-auto font-mono text-sm">{a.code}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p id={errorId} className="error">
          {error}
        </p>
      )}
    </div>
  );
}
