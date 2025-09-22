import { useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchCity } from '../api/geocoding';

function formatCityLabel(option) {
  if (!option) {
    return '';
  }
  return `${option.name}${option.state ? ', ' + option.state : ''}, ${option.country}`;
}

export default function CitySearch({ onSelect, className = '', selectedCity = null }) {
  const [query, setQuery] = useState(formatCityLabel(selectedCity));
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 300);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const inputId = useId();

  useEffect(() => {
    const handler = (event) => {
      if (!boxRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      setQuery('');
      return;
    }
    setQuery(formatCityLabel(selectedCity));
  }, [selectedCity]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = debounced.trim();
      if (term.length < 2) {
        setOptions([]);
        setOpen(false);
        return;
      }

      try {
        setLoading(true);
        const res = await searchCity(term, 5);
        if (cancelled) {
          return;
        }
        setOptions(res || []);
        setOpen(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (!String(error).includes('AbortError')) {
          console.error('search error:', error);
        }
        setOptions([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  function pick(option) {
    setQuery(formatCityLabel(option));
    setOpen(false);

    onSelect?.(option);
  }

  const containerClass = ['city-search', className].filter(Boolean).join(' ');
  const showClear = query.length > 0;

  return (
    <div ref={boxRef} className={containerClass}>
      <label className="city-search__label" htmlFor={inputId}>
        City
      </label>
      <div className="city-search__field">
        <input
          ref={inputRef}
          id={inputId}
          className="city-search__input"
          role="combobox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (options.length) {
              setOpen(true);
            }
          }}
          placeholder="Search for a city... (e.g. Hanoi, Tokyo)"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`${inputId}-list`}
          aria-haspopup="listbox"
          aria-expanded={open}
        />
        {showClear && (
          <button
            type="button"
            className="city-search__clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              <path
                d="M3 3l6 6M9 3 3 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          className="city-search__dropdown"
          role="listbox"
          id={`${inputId}-list`}
          aria-label="Suggested cities"
        >
          {loading && <div className="city-search__state">Searching...</div>}
          {!loading && options.length === 0 && (
            <div className="city-search__state">No matches found</div>
          )}
          {!loading && options.length > 0 && (
            <div className="city-search__dropdown-inner">
              {options.map((option, index) => (
                <button
                  key={`${option.lat}-${option.lon}-${index}`}
                  type="button"
                  className="city-search__item"
                  onClick={() => pick(option)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  aria-selected="false"
                >
                  <p className="city-search__item-title">
                    {option.name}
                    {option.state ? `, ${option.state}` : ''}
                  </p>
                  <p className="city-search__item-meta">
                    {option.country} - {option.lat.toFixed(2)}, {option.lon.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
