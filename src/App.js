import { useEffect, useMemo, useState } from 'react';
import CitySearch from './components/CitySearch';
import { useCurrentWeather } from './hooks/useWeather';
import { useForecastDaily } from './hooks/useForecast';
import FiveDay from './components/FiveDay';
import './styles/App.css';

const LAST_CITY_KEY = 'weather:last-city';

function describeCity(city) {
  if (!city) {
    return '';
  }
  const locality = city.state ? `${city.name}, ${city.state}` : city.name;
  return `${locality} - ${city.country}`;
}

export default function App() {
  const [city, setCity] = useState(null);
  const units = 'metric';
  const lang = 'en';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(LAST_CITY_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed?.lat != null && parsed?.lon != null) {
        setCity(parsed);
      }
    } catch (error) {
      console.warn('Unable to restore last city from storage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (!city || city.lat == null || city.lon == null) {
        window.localStorage.removeItem(LAST_CITY_KEY);
        return;
      }
      window.localStorage.setItem(LAST_CITY_KEY, JSON.stringify(city));
    } catch (error) {
      console.warn('Unable to persist city to storage', error);
    }
  }, [city]);

  const { data: current, loading: loadingCur, error: errCur } =
    useCurrentWeather(city?.lat, city?.lon, units, lang);

  const { daily, loading: loadingFc, error: errFc } =
    useForecastDaily(city?.lat, city?.lon, units, lang, { excludeToday: false, limitDays: 5 });

  const loading = loadingCur || loadingFc;
  const error = errCur || errFc;

  const headline = useMemo(() => {
    if (!city) {
      return 'Search for any city to see current conditions and a five day outlook.';
    }
    if (loading) {
      return 'Fetching the latest data...';
    }
    if (error) {
      return 'We could not load the weather just now.';
    }
    return `Forecast for ${describeCity(city)}`;
  }, [city, loading, error]);

  return (
    <div className="app">
      <header className="app__hero">
        <div className="app__hero-copy">
          <p className="app__eyebrow">Forecast dashboard</p>
          <h1 className="app__title">Plan your day with confidence</h1>
          <p className="app__subtitle">{headline}</p>
        </div>

        <CitySearch className="app__search" onSelect={setCity} selectedCity={city} />
      </header>

      <main className="app__body">
        {!city && (
          <div className="app__empty">
            <p>Try typing London, Tokyo, or any city around the globe to get started.</p>
          </div>
        )}

        {city && (
          <>
            <section className="current-card" aria-live="polite">
              <div className="current-card__header">
                <div>
                  <h2 className="current-card__title">{describeCity(city)}</h2>
                  <p className="current-card__meta">
                    Coordinates {Number(city.lat).toFixed(2)}, {Number(city.lon).toFixed(2)}
                  </p>
                </div>
                {current?.weather?.[0]?.icon && (
                  <img
                    className="current-card__icon"
                    alt={current.weather[0].description || 'Weather icon'}
                    src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
                  />
                )}
              </div>

              {loading && <p className="app__status">Loading data...</p>}
              {!loading && error && <p className="app__status app__status--error">Error: {error}</p>}

              {!loading && !error && current && (
                <div className="current-card__content">
                  <p className="current-card__temperature">
                    {Math.round(current.main.temp)}
                    {'\u00B0'}
                    {units === 'imperial' ? 'F' : 'C'}
                  </p>
                  <div className="current-card__details">
                    <p className="current-card__condition">
                      {current.weather?.[0]?.description || 'No description available'}
                    </p>
                    <dl className="current-card__metrics">
                      <div>
                        <dt>Feels like</dt>
                        <dd>
                          {Math.round(current.main.feels_like)}
                          {'\u00B0'}
                          {units === 'imperial' ? 'F' : 'C'}
                        </dd>
                      </div>
                      <div>
                        <dt>Humidity</dt>
                        <dd>{current.main.humidity}%</dd>
                      </div>
                      <div>
                        <dt>Wind</dt>
                        <dd>
                          {Math.round(current.wind?.speed || 0)}{' '}
                          {units === 'imperial' ? 'mph' : 'm/s'}
                        </dd>
                      </div>
                      <div>
                        <dt>Pressure</dt>
                        <dd>{current.main.pressure} hPa</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </section>

            <FiveDay daily={daily} units={units} loading={loading} error={error} />
          </>
        )}
      </main>
    </div>
  );
}
