import { useEffect, useState } from "react";
import { getCurrentWeather } from "../api/openweather";

export function useCurrentWeather(lat, lon, units = "metric", lang = "en") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;

    let alive = true;
    setLoading(true);
    setErr(null);

    getCurrentWeather(lat, lon, units, lang)
      .then(d => { if (alive) setData(d); })
      .catch(e => { if (alive) setErr(String(e)); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [lat, lon, units, lang]);

  return { data, loading, error };
}
