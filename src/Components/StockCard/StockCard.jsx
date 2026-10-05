import { useTranslation } from "react-i18next";
import Sparkline from "../Sparkline/Sparkline";
import SourceBadge from "../SourceBadge/SourceBadge";
import { useTimeSeries } from "../../hooks/useTimeSeries";
import { DAILY } from "../../services/twelveData";
import { formatPercent, formatPrice, percentChange } from "../../utils/format";

// En celular se ve como ficha compacta (símbolo, precio y %); desde sm, como
// fila con nombre y mini gráfico.
export default function StockCard({ symbol, name, selected, onSelect, index }) {
  const { t } = useTranslation();
  const { data, loading, error, source, refresh } = useTimeSeries(symbol, DAILY);

  const points = data?.points ?? [];
  const last = points.at(-1);
  const prev = points.at(-2);
  const change = last && prev ? percentChange(prev.close, last.close) : null;
  const trendClass =
    change === null ? "text-muted" : change >= 0 ? "text-up" : "text-down";
  const delay = index * 90;

  return (
    <li className="animate-rise min-w-0" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={() => onSelect(symbol)}
        aria-pressed={selected}
        className={`relative flex w-full flex-col items-center rounded-xl px-1 py-2 text-center transition-colors duration-200 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:px-4 sm:py-3 sm:text-left ${
          selected ? "bg-surface shadow-sm" : "hover:bg-surface/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent transition-opacity duration-300 sm:inset-x-auto sm:inset-y-3 sm:left-0 sm:h-auto sm:w-1 ${
            selected ? "opacity-100" : "opacity-0"
          }`}
        />

        <span className="min-w-0">
          <span className="block font-display text-base font-semibold leading-tight sm:text-lg">
            {symbol}
          </span>
          <span className="hidden truncate text-sm text-muted sm:block">
            {name}
          </span>
        </span>

        <span className="hidden sm:block">
          {data ? (
            <Sparkline
              values={points.map((p) => p.close)}
              className={trendClass}
              delay={delay + 250}
            />
          ) : (
            <span className="skeleton block h-8 w-24 rounded" />
          )}
        </span>

        <span className="tabular-nums sm:min-w-20 sm:text-right">
          {data && last ? (
            <>
              <span className="block text-xs font-medium sm:text-base">
                {formatPrice(last.close, data.currency)}
              </span>
              <span className={`block text-xs sm:text-sm ${trendClass}`}>
                {change === null ? "—" : formatPercent(change)}
              </span>
            </>
          ) : (
            <>
              <span className="skeleton mx-auto mt-1 block h-4 w-14 rounded sm:mr-0 sm:h-5 sm:w-20" />
              <span className="skeleton mx-auto mt-1 block h-3 w-10 rounded sm:mr-0 sm:h-4 sm:w-14" />
            </>
          )}
        </span>
      </button>

      {error && (
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-1 pt-1 pb-2 text-xs text-down sm:justify-start sm:px-4">
          <SourceBadge source={source} />
          <span className="hidden sm:inline">{t(error)}</span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="font-medium underline underline-offset-2 disabled:opacity-50"
          >
            {t("errors.retry")}
          </button>
        </p>
      )}
    </li>
  );
}
