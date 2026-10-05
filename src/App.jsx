import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import StockCard from "./Components/StockCard/StockCard";
import StockChart from "./Components/StockChart/StockChart";
import MarketStatus from "./Components/MarketStatus/MarketStatus";
import ThemeToggle from "./Components/ThemeToggle/ThemeToggle";
import LanguageSwitcher from "./Components/LanguageSwitcher/LanguageSwitcher";
import ContactLinks from "./Components/ContactLinks/ContactLinks";
import { useTheme } from "./hooks/useTheme";
import { isApiConfigured } from "./services/twelveData";
import { prefersReducedMotion } from "./utils/motion";

const STOCKS = [
  { symbol: "IBM", name: "IBM Corp." },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
];

export default function App() {
  const { t } = useTranslation();
  const [selectedSymbol, setSelectedSymbol] = useState(STOCKS[0].symbol);
  const { theme, toggle: toggleTheme } = useTheme();
  const chartRef = useRef(null);
  const selected = STOCKS.find((s) => s.symbol === selectedSymbol);

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    // En pantallas angostas el gráfico queda debajo de la lista: se lleva a la vista.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        chartRef.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        })
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-5 pb-2 sm:px-6 lg:pt-8">
      <header className="animate-rise">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Demo Bolsa
          </h1>
          <div className="flex items-center gap-2">
            <div className="mr-3 hidden sm:block">
              <MarketStatus />
            </div>
            <LanguageSwitcher />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:mt-2">
          <p className="max-w-prose text-sm text-muted sm:text-base">
            {t("header.intro")}
          </p>
          <div className="sm:hidden">
            <MarketStatus />
          </div>
        </div>
      </header>

      {!isApiConfigured && (
        <p
          role="status"
          className="animate-rise mt-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-2 text-sm text-warn"
        >
          {t("demoMode")}
        </p>
      )}

      <main className="mt-4 grid grid-cols-1 items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-8">
        {/* En celular, fichas compactas en una fila; desde sm, lista en filas. */}
        <ul
          aria-label={t("stocks.list")}
          className="grid grid-cols-4 gap-1.5 sm:grid-cols-1 sm:gap-1"
        >
          {STOCKS.map((stock, index) => (
            <StockCard
              key={stock.symbol}
              symbol={stock.symbol}
              name={stock.name}
              index={index}
              selected={stock.symbol === selectedSymbol}
              onSelect={handleSelect}
            />
          ))}
        </ul>

        <div ref={chartRef} className="min-w-0 scroll-mt-4">
          <StockChart symbol={selected.symbol} name={selected.name} />
        </div>
      </main>

      {/* mt-auto empuja el pie al borde inferior cuando el contenido es más
          corto que la pantalla (por ejemplo, en un iPad Pro). Los créditos van
          sobre la línea divisoria y la firma queda sola debajo. */}
      <footer className="mt-auto pt-5 text-xs text-muted sm:text-sm lg:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pb-2">
          <p>
            {t("footer.dataFrom")}{" "}
            <a
              href="https://twelvedata.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              Twelve Data
            </a>
            <span className="hidden sm:inline">{t("footer.delay")}</span>.
          </p>
          <a
            href="https://github.com/hrking31/Demo-Bolsa"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            {t("footer.code")}
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-line pt-2">
          <ContactLinks />
          <p className="text-center">
            {t("footer.developedBy")}{" "}
            <span className="font-medium text-ink">Hernando Rey</span> —{" "}
            {t("footer.crafted")} ☕
          </p>
        </div>
      </footer>
    </div>
  );
}
