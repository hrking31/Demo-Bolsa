import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSampleSeries } from "./sampleData";

const DAILY = { interval: "1day", outputsize: 30 };
const INTRADAY = { interval: "5min", outputsize: 78 };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0)); // lunes 5 de octubre de 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getSampleSeries", () => {
  test("siempre genera los mismos datos para el mismo símbolo", () => {
    expect(getSampleSeries("IBM", DAILY)).toEqual(getSampleSeries("IBM", DAILY));
    expect(getSampleSeries("IBM", DAILY)).not.toEqual(getSampleSeries("AAPL", DAILY));
  });

  test("la serie diaria tiene un punto por día hábil, sin fines de semana", () => {
    const { points } = getSampleSeries("MSFT", DAILY);

    expect(points).toHaveLength(30);
    expect(points.at(-1).time).toBe("2026-10-05");
    for (const { time } of points) {
      const day = new Date(`${time}T12:00:00`).getDay();
      expect([0, 6]).not.toContain(day);
    }
  });

  test("la sesión intradía va de 9:30 a 15:55 cada 5 minutos", () => {
    const { points } = getSampleSeries("AAPL", INTRADAY);

    expect(points).toHaveLength(78);
    expect(points[0].time).toBe("2026-10-05 09:30:00");
    expect(points[1].time).toBe("2026-10-05 09:35:00");
    expect(points.at(-1).time).toBe("2026-10-05 15:55:00");
  });

  test("el día empieza en el cierre anterior y termina en el precio actual", () => {
    const daily = getSampleSeries("GOOGL", DAILY).points;
    const intraday = getSampleSeries("GOOGL", INTRADAY).points;

    expect(intraday.at(-1).close).toBeCloseTo(daily.at(-1).close, 2);
    expect(intraday[0].close).toBeCloseTo(daily.at(-2).close, 1);
  });

  test("cada punto es coherente: mínimo ≤ cierre ≤ máximo", () => {
    for (const preset of [DAILY, INTRADAY]) {
      for (const { close, high, low } of getSampleSeries("IBM", preset).points) {
        expect(low).toBeLessThanOrEqual(close);
        expect(close).toBeLessThanOrEqual(high);
      }
    }
  });

  test("un símbolo desconocido también recibe datos", () => {
    const { points, currency } = getSampleSeries("TSLA", DAILY);

    expect(currency).toBe("USD");
    expect(points).toHaveLength(30);
    expect(points.every((p) => p.close > 0)).toBe(true);
  });
});
