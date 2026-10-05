import Sparkline from "../Sparkline/Sparkline";
import SourceBadge from "../SourceBadge/SourceBadge";
import { useTimeSeries } from "../../hooks/useTimeSeries";
import { DAILY } from "../../services/twelveData";
import { formatPercent, formatPrice, percentChange } from "../../utils/format";

export default function StockCard({ symbol, name, selected, onSelect, index }) {
  const { data, loading, error, source, refresh } = useTimeSeries(symbol, DAILY);

  const points = data?.points ?? [];
  const last = points.at(-1);
  const prev = points.at(-2);
  const change = last && prev ? percentChange(prev.close, last.close) : null;
  const trendClass =
    change === null ? "text-muted" : change >= 0 ? "text-up" : "text-down";
  const delay = index * 90;

  return (
    <li className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={() => onSelect(symbol)}
        aria-pressed={selected}
        className={`relative grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 sm:gap-4 ${
          selected ? "bg-surface shadow-sm" : "hover:bg-surface/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-3 left-0 w-1 rounded-full bg-accent transition-transform duration-300 ${
            selected ? "scale-y-100" : "scale-y-0"
          }`}
        />

        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold leading-tight">
            {symbol}
          </span>
          <span className="block truncate text-sm text-muted">{name}</span>
        </span>

        {data ? (
          <Sparkline
            values={points.map((p) => p.close)}
            className={trendClass}
            delay={delay + 250}
          />
        ) : (
          <span className="skeleton block h-8 w-24 rounded" />
        )}

        <span className="min-w-20 text-right tabular-nums">
          {data && last ? (
            <>
              <span className="block font-medium">
                {formatPrice(last.close, data.currency)}
              </span>
              <span className={`block text-sm ${trendClass}`}>
                {change === null ? "—" : formatPercent(change)}
              </span>
            </>
          ) : (
            <>
              <span className="skeleton ml-auto block h-5 w-20 rounded" />
              <span className="skeleton mt-1 ml-auto block h-4 w-14 rounded" />
            </>
          )}
        </span>
      </button>

      {error && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-1 pb-2 text-xs text-down">
          <SourceBadge source={source} />
          <span>{error}</span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="font-medium underline underline-offset-2 disabled:opacity-50"
          >
            Reintentar
          </button>
        </p>
      )}
    </li>
  );
}
