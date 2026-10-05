import { useRef, useState } from "react";
import StockCard from "./Components/StockCard/StockCard";
import StockChart from "./Components/StockChart/StockChart";
import MarketStatus from "./Components/MarketStatus/MarketStatus";
import { hasApiKey } from "./services/twelveData";
import { prefersReducedMotion } from "./utils/motion";

const STOCKS = [
  { symbol: "IBM", name: "IBM Corp." },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
];

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(STOCKS[0].symbol);
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
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:py-14">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Demo Bolsa
          </h1>
          <p className="mt-2 max-w-prose text-muted">
            Cotizaciones de cuatro acciones de EE. UU. Elige una para ver cómo
            se movió su precio.
          </p>
        </div>
        <MarketStatus />
      </header>

      {!hasApiKey && (
        <p
          role="status"
          className="animate-rise mt-6 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          Modo demostración: no hay una clave de API configurada, así que se
          muestran datos de ejemplo, no precios reales.
        </p>
      )}

      <main className="mt-8 grid grid-cols-1 items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-8">
        <ul aria-label="Acciones" className="space-y-1">
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

      <footer className="mt-12 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-sm text-muted">
        <p>
          Datos de mercado de{" "}
          <a
            href="https://twelvedata.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            Twelve Data
          </a>
          . Los precios pueden tener retraso.
        </p>
        <p>
          Hecho por Hernando Rey.{" "}
          <a
            href="https://github.com/hrking31/Demo-Bolsa"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            Ver el código en GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
