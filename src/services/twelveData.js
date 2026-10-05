import { getSampleSeries } from "./sampleData";

const BASE_URL = "https://api.twelvedata.com";
const API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const CACHE_PREFIX = "demo-bolsa:";

export const hasApiKey = Boolean(API_KEY);

// Configuraciones de consulta. Son constantes del módulo para que sirvan
// como dependencias estables en los hooks.
export const DAILY = { interval: "1day", outputsize: 30, ttlMs: 60 * 60 * 1000 };
export const INTRADAY = { interval: "5min", outputsize: 78, ttlMs: 10 * 60 * 1000 };

// Solicitudes en curso, para no repetir la misma consulta si dos
// componentes (o el doble montaje de StrictMode) la piden a la vez.
const pending = new Map();

class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

const cacheKeyFor = (symbol, { interval, outputsize }) =>
  `${CACHE_PREFIX}${symbol}:${interval}:${outputsize}`;

function readCache(key, maxAgeMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    return Date.now() - savedAt < maxAgeMs ? data : null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Sin almacenamiento disponible (modo privado, cuota llena): se ignora.
  }
}

// Los errores se expresan como claves de traducción (src/i18n/*.json), para
// que la interfaz los muestre en el idioma activo.
function errorKey(code) {
  if (code === 429) return "errors.rateLimit";
  if (code === 401 || code === 403) return "errors.invalidKey";
  if (code === 400 || code === 404) return "errors.notFound";
  return "errors.unexpected";
}

async function requestTimeSeries(symbol, { interval, outputsize }) {
  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: String(outputsize),
    apikey: API_KEY,
  });

  let res;
  try {
    res = await fetch(`${BASE_URL}/time_series?${params}`);
  } catch {
    throw new ApiError("errors.network", "NETWORK");
  }

  // Twelve Data responde los errores con HTTP 200 y { status: "error", code, message }.
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.status === "error") {
    const code = body?.code ?? res.status;
    throw new ApiError(errorKey(code), code);
  }

  // La API entrega los datos del más reciente al más antiguo; se invierten
  // para que los gráficos vayan de izquierda (antiguo) a derecha (reciente).
  const points = (body.values ?? [])
    .map((v) => ({
      time: v.datetime,
      close: parseFloat(v.close),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
    }))
    .filter((p) => Number.isFinite(p.close))
    .reverse();

  if (points.length === 0) {
    throw new ApiError("errors.notFound", "EMPTY");
  }

  return { symbol, points, currency: body.meta?.currency ?? "USD" };
}

async function fetchTimeSeries(symbol, preset, force) {
  const key = cacheKeyFor(symbol, preset);

  if (!force) {
    const cached = readCache(key, preset.ttlMs);
    if (cached) return cached;
  }
  if (pending.has(key)) return pending.get(key);

  const request = requestTimeSeries(symbol, preset)
    .then((data) => {
      writeCache(key, data);
      return data;
    })
    .finally(() => pending.delete(key));

  pending.set(key, request);
  return request;
}

/**
 * Obtiene una serie de precios y nunca rechaza: si la API falla, devuelve
 * la última copia guardada o, en su defecto, datos de ejemplo.
 *
 * `error` es una clave de traducción (por ejemplo "errors.rateLimit").
 *
 * @returns {Promise<{ data, source: "api" | "cache" | "sample", error: string | null }>}
 */
export async function loadSeries(symbol, preset, { force = false } = {}) {
  if (!hasApiKey) {
    return {
      data: getSampleSeries(symbol, preset),
      source: "sample",
      error: null,
    };
  }

  try {
    const data = await fetchTimeSeries(symbol, preset, force);
    return { data, source: "api", error: null };
  } catch (err) {
    const stale = readCache(cacheKeyFor(symbol, preset), Infinity);
    if (stale) return { data: stale, source: "cache", error: err.message };
    return {
      data: getSampleSeries(symbol, preset),
      source: "sample",
      error: err.message,
    };
  }
}
