import { describe, expect, test } from "vitest";
import es from "./es.json";
import en from "./en.json";

// Lista "a.b.c" de todas las claves de un archivo de traducciones.
function keysOf(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

const get = (obj, path) => path.split(".").reduce((acc, part) => acc?.[part], obj);
const placeholders = (text) => [...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();

describe("traducciones", () => {
  test("español e inglés tienen exactamente las mismas claves", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });

  test("ningún texto está vacío", () => {
    for (const lang of [es, en]) {
      for (const key of keysOf(lang)) {
        expect(get(lang, key), key).toMatch(/\S/);
      }
    }
  });

  test("los dos idiomas usan las mismas variables ({{date}}, {{name}}…)", () => {
    for (const key of keysOf(es)) {
      expect(placeholders(get(en, key)), key).toEqual(placeholders(get(es, key)));
    }
  });
});
