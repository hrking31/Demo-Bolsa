import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import SourceBadge from "../SourceBadge/SourceBadge";
import { useTimeSeries } from "../../hooks/useTimeSeries";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { DAILY, INTRADAY, isApiConfigured } from "../../services/twelveData";
import { getChartColors, withAlpha } from "../../theme";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatShortDate,
  formatTime,
  percentChange,
} from "../../utils/format";
import { prefersReducedMotion } from "../../utils/motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);
ChartJS.defaults.font.family = '"IBM Plex Sans", system-ui, sans-serif';

const RANGES = [
  { id: "1D", labelKey: "chart.range1D", preset: INTRADAY },
  { id: "1M", labelKey: "chart.range1M", preset: DAILY },
];

// Etiqueta corta en celular (1D / 1M, como en las plataformas de trading) y
// completa desde sm; las dos se anuncian igual a los lectores de pantalla.
function RangeLabel({ id, label }) {
  return (
    <>
      <span aria-hidden="true" className="sm:hidden">
        {id}
      </span>
      <span className="sr-only sm:not-sr-only">{label}</span>
    </>
  );
}

// Línea vertical punteada que sigue al cursor sobre el gráfico.
// Su color llega por options.plugins.crosshair.color.
const crosshair = {
  id: "crosshair",
  afterDatasetsDraw(chart, _args, opts) {
    const active = chart.tooltip?.getActiveElements();
    if (!active?.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function buildChart({ points, currency, intraday, isUp, t, lang }) {
  // Se leen en cada render para seguir el tema activo (claro u oscuro).
  const colors = getChartColors();
  const lineColor = isUp ? colors.up : colors.down;
  const data = {
    labels: points.map((p) =>
      intraday ? formatTime(p.time) : formatShortDate(p.time, lang)
    ),
    datasets: [
      {
        data: points.map((p) => p.close),
        borderColor: lineColor,
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        backgroundColor: ({ chart }) => {
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, withAlpha(lineColor, 0.2));
          gradient.addColorStop(1, withAlpha(lineColor, 0));
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: colors.surface,
        pointHoverBorderColor: lineColor,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion()
      ? false
      : { duration: 900, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      crosshair: { color: colors.guide },
      tooltip: {
        backgroundColor: colors.raised,
        borderColor: colors.line,
        borderWidth: 1,
        titleColor: colors.muted,
        bodyColor: colors.ink,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: "500" },
        bodyFont: { size: 14, weight: "600" },
        callbacks: {
          title: ([item]) => {
            const { time } = points[item.dataIndex];
            return intraday
              ? t("chart.tooltipTime", {
                  date: formatDate(time, lang),
                  time: formatTime(time),
                })
              : formatDate(time, lang);
          },
          label: (item) => formatPrice(item.parsed.y, currency),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: colors.muted,
          maxTicksLimit: 6,
          maxRotation: 0,
          autoSkipPadding: 18,
        },
      },
      y: {
        position: "right",
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: colors.muted,
          maxTicksLimit: 5,
          callback: (v) => formatPrice(v, currency),
        },
      },
    },
  };

  return { data, options };
}

export default function StockChart({ symbol, name }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const [rangeId, setRangeId] = useState("1D");
  const range = RANGES.find((r) => r.id === rangeId);
  const intraday = range.preset === INTRADAY;

  // La serie diaria ya la cargó la fila de la lista: sale del caché sin gastar consultas.
  const daily = useTimeSeries(symbol, DAILY);
  const series = useTimeSeries(symbol, range.preset);

  const dailyPoints = daily.data?.points ?? [];
  const last = dailyPoints.at(-1);
  const prev = dailyPoints.at(-2);
  const currency = daily.data?.currency ?? "USD";
  const animatedPrice = useAnimatedNumber(last?.close ?? null);

  // La serie intradía puede traer el final de la sesión anterior: se deja
  // solo la sesión más reciente para no mezclar dos días en el gráfico
  // (salvo justo al abrir el mercado, cuando aún no hay puntos suficientes).
  const seriesPoints = series.data?.points ?? [];
  const sessionDate = seriesPoints.at(-1)?.time.slice(0, 10);
  const sessionPoints = seriesPoints.filter((p) => p.time.startsWith(sessionDate));
  const points =
    intraday && sessionPoints.length > 1 ? sessionPoints : seriesPoints;
  const change = intraday
    ? last && prev
      ? percentChange(prev.close, last.close)
      : null
    : points.length > 1
      ? percentChange(points[0].close, points.at(-1).close)
      : null;
  const isUp = (change ?? 0) >= 0;
  const chart =
    points.length > 1
      ? buildChart({ points, currency, intraday, isUp, t, lang })
      : null;

  const high = points.length ? Math.max(...points.map((p) => p.high)) : null;
  const low = points.length ? Math.min(...points.map((p) => p.low)) : null;
  const source = series.source === "api" ? daily.source : series.source;

  return (
    <section
      aria-labelledby="chart-title"
      className="animate-rise min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6"
      style={{ animationDelay: "150ms" }}
    >
      <header>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2
              id="chart-title"
              className="truncate font-display text-xl font-bold sm:text-2xl"
            >
              {name}
            </h2>
            <span className="text-muted">{symbol}</span>
            <SourceBadge source={source} />
          </div>

          <div
            role="group"
            aria-label={t("chart.range")}
            className="inline-flex shrink-0 rounded-full bg-paper p-1"
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={r.id === rangeId}
                onClick={() => setRangeId(r.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 sm:px-4 ${
                  r.id === rangeId
                    ? "bg-raised text-ink shadow-sm ring-1 ring-line"
                    : "text-muted hover:text-ink"
                }`}
              >
                <RangeLabel id={r.id} label={t(r.labelKey)} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {animatedPrice != null ? (
            <span className="font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
              {formatPrice(animatedPrice, currency)}
            </span>
          ) : (
            <span className="skeleton block h-10 w-40 rounded-lg" />
          )}
          {change !== null && (
            <span
              className={`text-sm font-medium tabular-nums sm:text-base ${
                isUp ? "text-up" : "text-down"
              }`}
            >
              {formatPercent(change)}{" "}
              <span className="font-normal text-muted">
                {intraday ? t("chart.vsPrevClose") : t("chart.lastMonth")}
              </span>
            </span>
          )}
        </div>
      </header>

      {series.error && (
        <div
          role="status"
          className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-down/10 px-3 py-2 text-sm text-down"
        >
          <span>{t(series.error)}</span>
          <button
            type="button"
            onClick={series.refresh}
            disabled={series.loading}
            className="font-medium underline underline-offset-2 disabled:opacity-50"
          >
            {t("errors.retry")}
          </button>
        </div>
      )}

      {/* La altura se adapta a la pantalla para evitar el scroll: crece en
          pantallas altas y se encoge hasta un mínimo legible en las bajas. */}
      <div className="graph-paper mt-3 h-[clamp(11rem,calc(100dvh_-_36rem),20rem)] rounded-xl p-2 sm:mt-4 sm:h-[clamp(11rem,calc(100dvh_-_48.5rem),22rem)] lg:h-[clamp(12rem,calc(100dvh_-_30rem),30rem)]">
        {chart ? (
          <div
            className={`relative h-full w-full min-w-0 transition-opacity duration-300 ${
              series.loading ? "opacity-50" : "opacity-100"
            }`}
          >
            <Line
              key={`${symbol}-${rangeId}`}
              data={chart.data}
              options={chart.options}
              plugins={[crosshair]}
              aria-label={t("chart.label", { name })}
              role="img"
            />
          </div>
        ) : (
          <div className="skeleton h-full w-full rounded-lg" />
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mt-4">
        <dl className="grid grid-cols-3 gap-x-6 text-sm sm:gap-x-10">
          <div>
            <dt className="text-xs text-muted sm:text-sm">{t("chart.high")}</dt>
            <dd className="font-medium tabular-nums">
              {high != null ? formatPrice(high, currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted sm:text-sm">{t("chart.low")}</dt>
            <dd className="font-medium tabular-nums">
              {low != null ? formatPrice(low, currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted sm:text-sm">
              {t("chart.prevClose")}
            </dt>
            <dd className="font-medium tabular-nums">
              {prev ? formatPrice(prev.close, currency) : "—"}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>
            {intraday
              ? points.length
                ? t("chart.session", { date: formatDate(points[0].time, lang) })
                : t("chart.nyTime")
              : t("chart.dailyClose")}
          </span>
          {isApiConfigured && (
            <button
              type="button"
              onClick={series.refresh}
              disabled={series.loading}
              className="rounded-full border border-line px-3 py-1 text-sm font-medium text-ink transition-colors hover:bg-raised disabled:opacity-50"
            >
              {series.loading ? t("chart.refreshing") : t("chart.refresh")}
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
