import { describe, expect, test } from "vitest";
import { isUsMarketOpen } from "./market";

// Las horas se dan en UTC; Nueva York está a UTC-4 en verano (EDT) y a
// UTC-5 en invierno (EST).
describe("isUsMarketOpen", () => {
  test.each([
    ["2026-10-05T13:29:00Z", false, "lunes 9:29 EDT, un minuto antes de abrir"],
    ["2026-10-05T13:30:00Z", true, "lunes 9:30 EDT, apertura"],
    ["2026-10-05T17:00:00Z", true, "lunes 13:00 EDT, a media sesión"],
    ["2026-10-05T19:59:00Z", true, "lunes 15:59 EDT, último minuto"],
    ["2026-10-05T20:00:00Z", false, "lunes 16:00 EDT, cierre"],
    ["2026-10-03T15:00:00Z", false, "sábado"],
    ["2026-10-04T15:00:00Z", false, "domingo"],
  ])("%s → abierto: %s (%s)", (iso, expected) => {
    expect(isUsMarketOpen(new Date(iso))).toBe(expected);
  });

  test("tiene en cuenta el horario de invierno (EST)", () => {
    // Lunes 7 de diciembre: 14:30 UTC son las 9:30 en Nueva York.
    expect(isUsMarketOpen(new Date("2026-12-07T14:29:00Z"))).toBe(false);
    expect(isUsMarketOpen(new Date("2026-12-07T14:30:00Z"))).toBe(true);
    expect(isUsMarketOpen(new Date("2026-12-07T21:00:00Z"))).toBe(false);
  });
});
