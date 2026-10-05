import { useTranslation } from "react-i18next";
import { saveLangChoice } from "../../i18n/lang";

// Botón al lado del tema: muestra el idioma al que se pasa (EN o ES), igual
// que en el sitio hernandorey. La etiqueta va en el idioma de destino.
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const target = i18n.resolvedLanguage === "en" ? "es" : "en";

  const handleClick = () => {
    i18n.changeLanguage(target);
    saveLangChoice(target);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      lang={target}
      aria-label={t("language.switch")}
      title={t("language.switch")}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-sm font-black text-muted shadow-sm transition-colors hover:text-ink"
    >
      {target.toUpperCase()}
    </button>
  );
}
