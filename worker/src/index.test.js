import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import worker, { clearMemoryCache } from "./index.js";

// Las pruebas nunca llaman a Twelve Data: `fetch` se reemplaza por una función
// simulada y la clave es falsa.

const KEY = "clave-secreta-de-prueba";
const ORIGIN = "https://demobolsa-31.web.app";
const env = { TWELVE_DATA_API_KEY: KEY };

const serie = { status: "ok", meta: { symbol: "IBM" }, values: [{ close: "1" }] };

function pedido(query = "symbol=IBM&interval=1day&outputsize=30", init = {}) {
  return new Request(`https://demo-bolsa-api.example.workers.dev/time_series?${query}`, {
    ...init,
    headers: { Origin: ORIGIN, ...init.headers },
  });
}

const twelveData = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  clearMemoryCache();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("seguridad", () => {
  test("rechaza pedidos desde otros dominios o sin origen", async () => {
    const otro = await worker.fetch(pedido(undefined, { headers: { Origin: "https://otro.com" } }), env);
    const sinOrigen = await worker.fetch(
      new Request("https://demo-bolsa-api.example.workers.dev/time_series?symbol=IBM&interval=1day&outputsize=30"),
      env
    );

    expect(otro.status).toBe(403);
    expect(sinOrigen.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each([
    ["un símbolo que la app no usa", "symbol=TSLA&interval=1day&outputsize=30"],
    ["un intervalo que la app no usa", "symbol=IBM&interval=1min&outputsize=30"],
    ["otro tamaño de serie", "symbol=IBM&interval=1day&outputsize=5000"],
    ["parámetros faltantes", "symbol=IBM"],
  ])("rechaza %s, para que la clave no sirva para otra cosa", async (_caso, query) => {
    const res = await worker.fetch(pedido(query), env);

    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("agrega la clave secreta al pedir a Twelve Data y nunca la devuelve", async () => {
    fetch.mockResolvedValue(twelveData(serie));

    const res = await worker.fetch(pedido(), env);
    const body = await res.text();

    const upstream = new URL(fetch.mock.calls[0][0]);
    expect(upstream.origin + upstream.pathname).toBe("https://api.twelvedata.com/time_series");
    expect(upstream.searchParams.get("apikey")).toBe(KEY);
    expect(body).not.toContain(KEY);
    expect([...res.headers.values()].join(" ")).not.toContain(KEY);
  });

  test("permite el origen de la app con CORS solo para GET", async () => {
    const res = await worker.fetch(pedido(undefined, { method: "OPTIONS" }), env);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
  });

  test("rechaza otros métodos y otras rutas", async () => {
    const post = await worker.fetch(pedido(undefined, { method: "POST" }), env);
    const ruta = await worker.fetch(
      new Request("https://demo-bolsa-api.example.workers.dev/quote", { headers: { Origin: ORIGIN } }),
      env
    );

    expect(post.status).toBe(405);
    expect(ruta.status).toBe(404);
  });

  test("sin el secreto configurado responde un error sin llamar a Twelve Data", async () => {
    const res = await worker.fetch(pedido(), {});

    expect(res.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("caché", () => {
  test("la segunda consulta igual se responde sin llamar a Twelve Data", async () => {
    fetch.mockResolvedValue(twelveData(serie));

    const primera = await worker.fetch(pedido(), env);
    const segunda = await worker.fetch(pedido(), env);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(primera.headers.get("X-Cache")).toBe("MISS");
    expect(segunda.headers.get("X-Cache")).toBe("HIT");
    expect(await segunda.json()).toEqual(serie);
  });

  test("cuando la copia vence vuelve a consultar", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    fetch.mockImplementation(async () => twelveData(serie));

    await worker.fetch(pedido(), env);
    vi.setSystemTime(Date.now() + 3600 * 1000 + 1);
    await worker.fetch(pedido(), env);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("cada símbolo e intervalo tiene su propia copia", async () => {
    fetch.mockImplementation(async () => twelveData(serie));

    await worker.fetch(pedido("symbol=IBM&interval=1day&outputsize=30"), env);
    await worker.fetch(pedido("symbol=IBM&interval=5min&outputsize=78"), env);
    await worker.fetch(pedido("symbol=AAPL&interval=1day&outputsize=30"), env);

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe("errores de Twelve Data", () => {
  test("reenvía el código con el formato de Twelve Data, sin el mensaje original", async () => {
    fetch.mockResolvedValue(
      twelveData({ status: "error", code: 429, message: "detalle interno de la cuenta" })
    );

    const res = await worker.fetch(pedido(), env);

    expect(await res.json()).toEqual({ status: "error", code: 429 });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  test("los errores no se guardan: el siguiente pedido vuelve a consultar", async () => {
    fetch
      .mockResolvedValueOnce(twelveData({ status: "error", code: 429 }))
      .mockResolvedValueOnce(twelveData(serie));

    await worker.fetch(pedido(), env);
    const res = await worker.fetch(pedido(), env);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await res.json()).toEqual(serie);
  });

  test("si Twelve Data no responde, devuelve 502", async () => {
    fetch.mockRejectedValue(new TypeError("fetch failed"));

    const res = await worker.fetch(pedido(), env);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ status: "error", code: 502 });
  });

  test("una respuesta ilegible de Twelve Data se informa como error 502", async () => {
    fetch.mockResolvedValue(new Response("<html>caído</html>", { status: 200 }));

    const res = await worker.fetch(pedido(), env);

    expect(await res.json()).toEqual({ status: "error", code: 502 });
  });
});
