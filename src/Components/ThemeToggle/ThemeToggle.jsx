import { useTranslation } from "react-i18next";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="theme-icon size-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="theme-icon size-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle({ theme, onToggle }) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const label = isDark ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:text-ink"
    >
      {/* La key reinicia la animación del ícono en cada cambio. */}
      <span key={theme}>{isDark ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );
}
