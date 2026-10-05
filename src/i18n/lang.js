const STORAGE_KEY = "demo-bolsa:lang";
const LANGS = ["es", "en"];

// Idioma guardado por el visitante; si no eligió, el de su navegador.
export function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    // Sin acceso a localStorage: se usa el idioma del navegador.
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

export function saveLangChoice(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Sin acceso a localStorage: la elección vale solo para esta visita.
  }
}
