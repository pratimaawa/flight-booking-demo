import type { Filters, SortKey, StopsFilter, TimeBand } from '@/lib/filters';
import { minFare } from '@/lib/filters';
import { formatMoney } from '@/lib/format';
import { airlineByCode } from '@/lib/mock/airlines';
import type { Offer } from '@/lib/types';

const toggle = <T extends string>(list: T[], v: T) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export function FiltersPanel({
  offers,
  filters,
  onChange,
}: {
  offers: Offer[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const airlines = [...new Set(offers.map((o) => o.airline))].sort();
  const prices = offers.map(minFare);
  const lo = Math.floor(Math.min(...prices) / 100);
  const hi = Math.ceil(Math.max(...prices) / 100);
  const max = filters.maxPrice ? Math.round(filters.maxPrice / 100) : hi;

  return (
    <div className="space-y-5 text-sm">
      <label className="block">
        <span className="label">Sort by</span>
        <select
          className="input"
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as SortKey })
          }
        >
          <option value="best">Best</option>
          <option value="cheapest">Cheapest</option>
          <option value="fastest">Fastest</option>
        </select>
      </label>
      <CheckGroup
        legend="Stops"
        options={[
          ['0', 'Direct'],
          ['1', '1 stop'],
          ['2', '2+ stops'],
        ]}
        selected={filters.stops}
        onToggle={(v) =>
          onChange({
            ...filters,
            stops: toggle(filters.stops, v as StopsFilter),
          })
        }
      />
      <CheckGroup
        legend="Airlines"
        options={airlines.map((c) => [c, airlineByCode.get(c)?.name ?? c])}
        selected={filters.airlines}
        onToggle={(v) =>
          onChange({ ...filters, airlines: toggle(filters.airlines, v) })
        }
      />
      <CheckGroup
        legend="Departure time"
        options={[
          ['morning', 'Morning (05–12)'],
          ['afternoon', 'Afternoon (12–18)'],
          ['evening', 'Evening (18–22)'],
          ['night', 'Night (22–05)'],
        ]}
        selected={filters.times}
        onToggle={(v) =>
          onChange({ ...filters, times: toggle(filters.times, v as TimeBand) })
        }
      />
      {offers.length > 0 && (
        <label className="block">
          <span className="label">
            Max price per adult: {formatMoney(max * 100)}
          </span>
          <input
            type="range"
            className="w-full accent-brand"
            min={lo}
            max={hi}
            step={10}
            value={max}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ ...filters, maxPrice: v >= hi ? null : v * 100 });
            }}
          />
        </label>
      )}
    </div>
  );
}

function CheckGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: [string, string][];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="space-y-1">
        {options.map(([value, label]) => (
          <label key={value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
