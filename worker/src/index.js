// Intermediario entre Demo Bolsa y la API de Twelve Data (Cloudflare Worker).
//
// - La clave vive como secreto del Worker (TWELVE_DATA_API_KEY) y nunca llega
//   al navegador.
// - Solo acepta las consultas que usa la app y solo desde sus dominios, así la
//   clave no sirve para otra cosa.
// - Reutiliza las respuestas recientes para no gastar el límite de consultas.
// - Los errores de Twelve Data se devuelven con su mismo formato
//   ({ status: "error", code }), para que la app los muestre igual que antes.

const UPSTREAM = "https://api.twelvedata.com/time_series";
const JSON_TYPE = "application/json; charset=utf-8";

export const ALLOWED_ORIGINS = new Set([
  "https://demobolsa-31.web.app",
  "https://demobolsa-31.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173",
]);

const SYMBOLS = new Set(["IBM", "AAPL", "MSFT", "GOOGL"]);

// Intervalos que pide la app (ver DAILY e INTRADAY en src/services/twelveData.js)
// y cuánto tiempo se reutiliza cada respuesta.
const PRESETS = {
  "1day": { outputsize: "30", ttlSeconds: 3600 },
  "5min": { outputsize: "78", ttlSeconds: 300 },
};

// Caché en memoria de esta instancia del Worker. En *.workers.dev la Cache API
// de Cloudflare no guarda nada; esta sí funciona mientras la instancia siga
// activa. Como mucho guarda 8 entradas (4 símbolos × 2 intervalos).
const memory = new Map();

export function clearMemoryCache() {
  memory.clear();
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}

function errorResponse(code, headers = {}) {
  return new Response(JSON.stringify({ status: "error", code }), {
    status: code,
    headers: { "Content-Type": JSON_TYPE, "Cache-Control": "no-store", ...headers },
  });
}

function dataResponse(body, preset, cors, cacheStatus) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": JSON_TYPE,
      "Cache-Control": `public, max-age=${preset.ttlSeconds}`,
      "X-Cache": cacheStatus,
      ...cors,
    },
  });
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    if (!ALLOWED_ORIGINS.has(origin)) return errorResponse(403);
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, "Access-Control-Max-Age": "86400" },
      });
    }
    if (request.method !== "GET") return errorResponse(405, cors);

    const url = new URL(request.url);
    if (url.pathname !== "/time_series") return errorResponse(404, cors);

    const symbol = url.searchParams.get("symbol");
    const interval = url.searchParams.get("interval");
    const preset = PRESETS[interval];
    if (
      !SYMBOLS.has(symbol) ||
      !preset ||
      url.searchParams.get("outputsize") !== preset.outputsize
    ) {
      return errorResponse(400, cors);
    }
    if (!env.TWELVE_DATA_API_KEY) return errorResponse(500, cors);

    const key = `${symbol}:${interval}`;
    const remembered = memory.get(key);
    if (remembered && remembered.expires > Date.now()) {
      return dataResponse(remembered.body, preset, cors, "HIT");
    }

    // Cache API: solo funciona si el Worker tiene un dominio propio.
    const cache = typeof caches === "undefined" ? undefined : caches.default;
    const cacheUrl = `https://demo-bolsa-cache.internal/${key}`;
    const cached = await cache?.match(cacheUrl);
    if (cached) {
      const body = await cached.text();
      memory.set(key, { body, expires: Date.now() + preset.ttlSeconds * 1000 });
      return dataResponse(body, preset, cors, "HIT");
    }

    const params = new URLSearchParams({
      symbol,
      interval,
      outputsize: preset.outputsize,
      apikey: env.TWELVE_DATA_API_KEY,
    });

    let upstream;
    try {
      upstream = await fetch(`${UPSTREAM}?${params}`);
    } catch {
      return errorResponse(502, cors);
    }

    const body = await upstream.text();
    const data = parse(body);

    // Twelve Data informa los errores con HTTP 200 y { status: "error", code }.
    // Solo se reenvía el código, nunca el mensaje original, y no se guarda.
    if (!upstream.ok || data?.status !== "ok") {
      const code = Number(data?.code) || (upstream.ok ? 502 : upstream.status);
      return new Response(JSON.stringify({ status: "error", code }), {
        status: 200,
        headers: { "Content-Type": JSON_TYPE, "Cache-Control": "no-store", ...cors },
      });
    }

    memory.set(key, { body, expires: Date.now() + preset.ttlSeconds * 1000 });
    if (cache) {
      const copy = new Response(body, {
        headers: {
          "Content-Type": JSON_TYPE,
          "Cache-Control": `max-age=${preset.ttlSeconds}`,
        },
      });
      ctx?.waitUntil?.(cache.put(cacheUrl, copy));
    }
    return dataResponse(body, preset, cors, "MISS");
  },
};
