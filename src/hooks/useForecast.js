import { useEffect, useState } from "react";
import { getForecast5d, aggregateForecastToDaily } from "../api/openweather";

export function useForecastDaily(lat, lon, units = "metric", lang = "en", { excludeToday = false, limitDays = 5 } = {}) {
  const [daily, setDaily] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let alive = true;
    setLoading(true); setErr(null);

    getForecast5d(lat, lon, units, lang)
      .then(f => {
        if (!alive) return;
        setCity(f.city);
        setDaily(aggregateForecastToDaily(f, { excludeToday, limitDays }));
      })
      .catch(e => { if (alive) setErr(String(e)); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [lat, lon, units, lang, excludeToday, limitDays]);

  return { daily, city, loading, error };
}
