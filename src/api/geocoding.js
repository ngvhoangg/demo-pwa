import { httpJson } from "./http";

let lastController;

export async function searchCity(q, limit = 5) {
  if (navigator.onLine === false)  return null; 

  if (lastController) lastController.abort();
  lastController = new AbortController();

  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", limit);
  url.searchParams.set("appid", process.env.REACT_APP_API_KEY);

  return httpJson(url.toString(), 10000, lastController.signal);
}
