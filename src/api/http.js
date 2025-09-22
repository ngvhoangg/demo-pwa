export async function httpJson(url, timeoutMs = 10000, extSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = extSignal
    ? mergeSignals(controller.signal, extSignal)
    : controller.signal;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

function mergeSignals(a, b) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  return ctrl.signal;
}
