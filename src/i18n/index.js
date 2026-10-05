import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./es.json";
import en from "./en.json";
import { initialLang } from "./lang";

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: "es",
  initAsync: false,
  // React ya escapa el texto.
  interpolation: { escapeValue: false },
});

// Mantiene <html lang> y la descripción para buscadores en el idioma activo.
function syncDocument(lng) {
  document.documentElement.lang = lng;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", i18n.t("meta.description", { lng }));
}

syncDocument(i18n.resolvedLanguage);
i18n.on("languageChanged", syncDocument);

export default i18n;
