import { httpJson } from "./http";

export async function getForecast5d(lat, lon, units = "metric", lang = "en") {
  const url = new URL(`https://api.openweathermap.org/data/2.5/forecast`);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", process.env.REACT_APP_API_KEY);
  url.searchParams.set("units", units);
  url.searchParams.set("lang", lang);

  return httpJson(url.toString());
}

export function aggregateForecastToDaily(
  forecast,
  { excludeToday = false, limitDays = 5 } = {}
) {
  if (!forecast || !forecast.list || !forecast.city) return [];
  const tz = forecast.city.timezone || 0; // seconds; list.dt is UTC

  // helper: create YYYY-MM-DD key based on local time
  const dayKey = (dtUTCsec) => {
    const ms = (dtUTCsec + tz) * 1000;
    const d = new Date(ms);
    return d.toISOString().slice(0, 10);
  };
  const localHour = (dtUTCsec) => {
    const ms = (dtUTCsec + tz) * 1000;
    return new Date(ms).getHours();
  };

  // group by local day
  const map = new Map();
  for (const it of forecast.list) {
    const key = dayKey(it.dt);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }

  // sort and summarize each day
  const days = [...map.entries()]
    .sort((a, b) => a[1][0].dt - b[1][0].dt)
    .map(([key, items]) => {
      const mins = items.map((i) => i.main.temp_min ?? i.main.temp);
      const maxs = items.map((i) => i.main.temp_max ?? i.main.temp);
      const min = Math.min(...mins);
      const max = Math.max(...maxs);
      const pop = Math.round(Math.max(...items.map((i) => i.pop || 0)) * 100) / 100;

      let rep = items[0];
      let bestDelta = 24;
      for (const i of items) {
        const delta = Math.abs(localHour(i.dt) - 12);
        if (delta < bestDelta) {
          bestDelta = delta;
          rep = i;
        }
      }
      const icon = rep.weather?.[0]?.icon;
      const description = rep.weather?.[0]?.description;

      return {
        date: key,
        dt: items[0].dt,
        temp: { min, max },
        icon,
        description,
        pop,
      };
    });

  // filter today if needed and limit number of days
  const todayKey = dayKey(Math.floor(Date.now() / 1000));
  const filtered = excludeToday ? days.filter((d) => d.date !== todayKey) : days;

  return filtered.slice(0, limitDays);
}

/** Get current weather by coordinates (no cache) */
export async function getCurrentWeather(lat, lon, units = "metric", lang = "en") {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", process.env.REACT_APP_API_KEY);
  url.searchParams.set("units", units);
  url.searchParams.set("lang", lang);

  return httpJson(url.toString());
}
