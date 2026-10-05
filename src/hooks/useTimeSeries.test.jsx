// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useTimeSeries } from "./useTimeSeries";
import { loadSeries } from "../services/twelveData";

vi.mock("../services/twelveData", () => ({ loadSeries: vi.fn() }));

const DAILY = { interval: "1day", outputsize: 30, ttlMs: 1000 };

// Promesa que la prueba resuelve cuando quiere, para simular respuestas lentas.
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

const resultado = (symbol) => ({
  data: { symbol, points: [{ time: "2026-10-05", close: 1 }], currency: "USD" },
  source: "api",
  error: null,
});

beforeEach(() => {
  loadSeries.mockReset();
});

describe("useTimeSeries", () => {
  test("empieza cargando y luego entrega los datos", async () => {
    loadSeries.mockResolvedValue(resultado("IBM"));

    const { result } = renderHook(() => useTimeSeries("IBM", DAILY));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.symbol).toBe("IBM");
    expect(result.current.source).toBe("api");
  });

  test("una respuesta lenta de la acción anterior nunca reemplaza a la actual", async () => {
    const ibm = deferred();
    const aapl = deferred();
    loadSeries.mockImplementation((symbol) =>
      symbol === "IBM" ? ibm.promise : aapl.promise
    );

    const { result, rerender } = renderHook(
      ({ symbol }) => useTimeSeries(symbol, DAILY),
      { initialProps: { symbol: "IBM" } }
    );
    rerender({ symbol: "AAPL" });

    // Llega primero AAPL y después, tarde, la respuesta vieja de IBM.
    await act(async () => aapl.resolve(resultado("AAPL")));
    await act(async () => ibm.resolve(resultado("IBM")));

    expect(result.current.data.symbol).toBe("AAPL");
    expect(result.current.loading).toBe(false);
  });

  test("mientras carga otra acción no muestra los datos de la anterior", async () => {
    const aapl = deferred();
    loadSeries.mockImplementation((symbol) =>
      symbol === "IBM" ? Promise.resolve(resultado("IBM")) : aapl.promise
    );

    const { result, rerender } = renderHook(
      ({ symbol }) => useTimeSeries(symbol, DAILY),
      { initialProps: { symbol: "IBM" } }
    );
    await waitFor(() => expect(result.current.data?.symbol).toBe("IBM"));

    rerender({ symbol: "AAPL" });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  test("refresh fuerza una consulta nueva y mantiene visibles los datos mientras llega", async () => {
    const segunda = deferred();
    loadSeries
      .mockResolvedValueOnce(resultado("IBM"))
      .mockReturnValueOnce(segunda.promise);

    const { result } = renderHook(() => useTimeSeries("IBM", DAILY));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refresh());

    expect(loadSeries).toHaveBeenLastCalledWith("IBM", DAILY, { force: true });
    expect(result.current.loading).toBe(true);
    expect(result.current.data.symbol).toBe("IBM");

    await act(async () => segunda.resolve(resultado("IBM")));
    expect(result.current.loading).toBe(false);
  });

  test("expone el error que entrega el servicio", async () => {
    loadSeries.mockResolvedValue({ ...resultado("IBM"), source: "sample", error: "errors.rateLimit" });

    const { result } = renderHook(() => useTimeSeries("IBM", DAILY));

    await waitFor(() => expect(result.current.error).toBe("errors.rateLimit"));
    expect(result.current.source).toBe("sample");
  });
});
