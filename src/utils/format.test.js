import { describe, expect, test } from "vitest";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatShortDate,
  formatTime,
  percentChange,
} from "./format";

describe("formatPrice", () => {
  test("usa el formato de dólares con dos decimales y separador de miles", () => {
    expect(formatPrice(221.5)).toBe("$221.50");
    expect(formatPrice(1234.567)).toBe("$1,234.57");
  });

  test("respeta otras monedas", () => {
    expect(formatPrice(10, "EUR")).toBe("€10.00");
  });
});

describe("formatPercent", () => {
  test("agrega el signo + a las subidas", () => {
    expect(formatPercent(1.234)).toBe("+1.23%");
  });

  test("deja el signo − de las bajadas y el cero sin signo", () => {
    expect(formatPercent(-0.49)).toBe("-0.49%");
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("percentChange", () => {
  test("calcula la variación porcentual entre dos precios", () => {
    expect(percentChange(200, 210)).toBe(5);
    expect(percentChange(222.64, 221.55)).toBeCloseTo(-0.4896, 3);
  });
});

describe("fechas y horas", () => {
  test("formatTime extrae la hora y los minutos", () => {
    expect(formatTime("2026-10-05 09:35:00")).toBe("09:35");
  });

  test("formatDate usa día/mes en español y mes/día en inglés", () => {
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
    expect(formatDate("2026-10-05 09:35:00", "es")).toBe("05/10/2026");
    expect(formatDate("2026-10-05 09:35:00", "en")).toBe("10/05/2026");
  });

  test("formatShortDate omite el año", () => {
    expect(formatShortDate("2026-10-05", "es")).toBe("05/10");
    expect(formatShortDate("2026-10-05", "en")).toBe("10/05");
  });
});
