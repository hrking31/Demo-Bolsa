import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Las pruebas nunca llaman a Twelve Data: `fetch` se reemplaza por una función
// simulada y la clave de API es falsa.

const respuesta = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});

// Así responde Twelve Data: del dato más reciente al más antiguo.
const serieIBM = {
  status: "ok",
  meta: { symbol: "IBM", currency: "USD" },
  values: [
    { datetime: "2026-10-02", close: "221.55", high: "222.86", low: "220.31" },
    { datetime: "2026-10-01", close: "222.64", high: "223.10", low: "221.00" },
  ],
};

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
}

// Carga el módulo de nuevo en cada prueba: la clave se lee al importarlo y
// las solicitudes en curso viven en el módulo.
async function cargarServicio(apiKey = "clave-de-prueba") {
  vi.resetModules();
  vi.stubEnv("VITE_TWELVE_DATA_API_KEY", apiKey);
  return import("./twelveData");
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("localStorage", memoryStorage());
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-05T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("loadSeries con respuesta correcta", () => {
  test("pide la serie correcta y ordena los precios del más antiguo al más reciente", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta(serieIBM));

    const result = await loadSeries("IBM", DAILY);

    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://api.twelvedata.com/time_series");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      symbol: "IBM",
      interval: "1day",
      outputsize: "30",
      apikey: "clave-de-prueba",
    });
    expect(result.source).toBe("api");
    expect(result.error).toBeNull();
    expect(result.data.points).toEqual([
      { time: "2026-10-01", close: 222.64, high: 223.1, low: 221 },
      { time: "2026-10-02", close: 221.55, high: 222.86, low: 220.31 },
    ]);
  });

  test("la segunda consulta sale del caché sin llamar otra vez a la API", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta(serieIBM));

    await loadSeries("IBM", DAILY);
    const second = await loadSeries("IBM", DAILY);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second.source).toBe("api");
    expect(second.data.points).toHaveLength(2);
  });

  test("dos pedidos simultáneos del mismo símbolo comparten una sola llamada", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta(serieIBM));

    await Promise.all([loadSeries("IBM", DAILY), loadSeries("IBM", DAILY)]);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("con force: true ignora el caché y vuelve a consultar", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta(serieIBM));

    await loadSeries("IBM", DAILY);
    await loadSeries("IBM", DAILY, { force: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("cuando el caché vence, vuelve a consultar", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta(serieIBM));

    await loadSeries("IBM", DAILY);
    vi.setSystemTime(Date.now() + DAILY.ttlMs + 1);
    await loadSeries("IBM", DAILY);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("loadSeries cuando la API falla", () => {
  // Twelve Data responde los errores con HTTP 200 y { status: "error", code }.
  test.each([
    [429, "errors.rateLimit"],
    [401, "errors.invalidKey"],
    [403, "errors.invalidKey"],
    [404, "errors.notFound"],
    [400, "errors.notFound"],
    [500, "errors.unexpected"],
  ])("el código %i se traduce a %s y se muestran datos de ejemplo", async (code, key) => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta({ status: "error", code, message: "..." }));

    const result = await loadSeries("IBM", DAILY);

    expect(result.error).toBe(key);
    expect(result.source).toBe("sample");
    expect(result.data.points.length).toBeGreaterThan(0);
  });

  test("una respuesta sin precios cuenta como símbolo sin datos", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue(respuesta({ status: "ok", values: [] }));

    const result = await loadSeries("IBM", DAILY);

    expect(result.error).toBe("errors.notFound");
  });

  test("un error HTTP con cuerpo ilegible no rompe la app", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => {
        throw new SyntaxError("no es JSON");
      },
    });

    const result = await loadSeries("IBM", DAILY);

    expect(result.error).toBe("errors.unexpected");
    expect(result.source).toBe("sample");
  });

  test("sin conexión usa la última copia guardada aunque haya vencido", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    fetch.mockResolvedValueOnce(respuesta(serieIBM));
    const first = await loadSeries("IBM", DAILY);

    vi.setSystemTime(Date.now() + DAILY.ttlMs * 5);
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await loadSeries("IBM", DAILY);

    expect(result.error).toBe("errors.network");
    expect(result.source).toBe("cache");
    expect(result.data).toEqual(first.data);
  });

  test("sin conexión y sin copia guardada muestra datos de ejemplo", async () => {
    const { loadSeries, INTRADAY } = await cargarServicio();
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await loadSeries("IBM", INTRADAY);

    expect(result.error).toBe("errors.network");
    expect(result.source).toBe("sample");
  });

  test("si el navegador bloquea localStorage, la app sigue funcionando", async () => {
    const { loadSeries, DAILY } = await cargarServicio();
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    fetch.mockResolvedValue(respuesta(serieIBM));

    const result = await loadSeries("IBM", DAILY);

    expect(result.source).toBe("api");
    expect(result.data.points).toHaveLength(2);
  });
});

describe("sin clave de API", () => {
  test("no llama a la API y muestra datos de ejemplo sin error", async () => {
    const { loadSeries, DAILY, hasApiKey } = await cargarServicio("");

    const result = await loadSeries("IBM", DAILY);

    expect(hasApiKey).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({ source: "sample", error: null });
  });
});
