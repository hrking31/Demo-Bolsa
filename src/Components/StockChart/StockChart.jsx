import { useState } from "react";
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
import { DAILY, INTRADAY, hasApiKey } from "../../services/twelveData";
import { colors } from "../../theme";
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
ChartJS.defaults.color = colors.muted;

const RANGES = [
  { id: "1D", label: "1 día", preset: INTRADAY },
  { id: "1M", label: "1 mes", preset: DAILY },
];

// Línea vertical punteada que sigue al cursor sobre el gráfico.
const crosshair = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements();
    if (!active?.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.guide;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function buildChart(points, currency, intraday, lineColor) {
  const data = {
    labels: points.map((p) =>
      intraday ? formatTime(p.time) : formatShortDate(p.time)
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
          gradient.addColorStop(0, `${lineColor}33`);
          gradient.addColorStop(1, `${lineColor}00`);
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: "#ffffff",
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
      tooltip: {
        backgroundColor: colors.ink,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: "500" },
        bodyFont: { size: 14, weight: "600" },
        callbacks: {
          title: ([item]) => {
            const { time } = points[item.dataIndex];
            return intraday
              ? `${formatDate(time)}, ${formatTime(time)} h`
              : formatDate(time);
          },
          label: (item) => formatPrice(item.parsed.y, currency),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { maxTicksLimit: 6, maxRotation: 0 },
      },
      y: {
        position: "right",
        grid: { display: false },
        border: { display: false },
        ticks: { maxTicksLimit: 5, callback: (v) => formatPrice(v, currency) },
      },
    },
  };

  return { data, options };
}

export default function StockChart({ symbol, name }) {
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
      ? buildChart(points, currency, intraday, isUp ? colors.up : colors.down)
      : null;

  const high = points.length ? Math.max(...points.map((p) => p.high)) : null;
  const low = points.length ? Math.min(...points.map((p) => p.low)) : null;
  const source = series.source === "api" ? daily.source : series.source;

  return (
    <section
      aria-labelledby="chart-title"
      className="animate-rise rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7"
      style={{ animationDelay: "150ms" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="chart-title" className="font-display text-2xl font-bold">
              {name}
            </h2>
            <span className="text-muted">{symbol}</span>
            <SourceBadge source={source} />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {animatedPrice != null ? (
              <span className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {formatPrice(animatedPrice, currency)}
              </span>
            ) : (
              <span className="skeleton block h-12 w-44 rounded-lg" />
            )}
            {change !== null && (
              <span
                className={`text-base font-medium tabular-nums ${
                  isUp ? "text-up" : "text-down"
                }`}
              >
                {formatPercent(change)}{" "}
                <span className="font-normal text-muted">
                  {intraday ? "frente al cierre anterior" : "en el último mes"}
                </span>
              </span>
            )}
          </div>
        </div>

        <div
          role="group"
          aria-label="Periodo del gráfico"
          className="inline-flex rounded-full bg-paper p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === rangeId}
              onClick={() => setRangeId(r.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                r.id === rangeId
                  ? "bg-ink text-surface"
                  : "text-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {series.error && (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-down/10 px-3 py-2 text-sm text-down"
        >
          <span>{series.error}</span>
          <button
            type="button"
            onClick={series.refresh}
            disabled={series.loading}
            className="font-medium underline underline-offset-2 disabled:opacity-50"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="graph-paper mt-6 h-64 rounded-xl p-2 sm:h-80 lg:h-[22rem]">
        {chart ? (
          <div
            className={`h-full transition-opacity duration-300 ${
              series.loading ? "opacity-50" : "opacity-100"
            }`}
          >
            <Line
              key={`${symbol}-${rangeId}`}
              data={chart.data}
              options={chart.options}
              plugins={[crosshair]}
              aria-label={`Gráfico de precios de ${name}`}
              role="img"
            />
          </div>
        ) : (
          <div className="skeleton h-full w-full rounded-lg" />
        )}
      </div>

      <footer className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <dl className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm sm:gap-x-10">
          <div>
            <dt className="text-muted">Máximo</dt>
            <dd className="font-medium tabular-nums">
              {high != null ? formatPrice(high, currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mínimo</dt>
            <dd className="font-medium tabular-nums">
              {low != null ? formatPrice(low, currency) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Cierre anterior</dt>
            <dd className="font-medium tabular-nums">
              {prev ? formatPrice(prev.close, currency) : "—"}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-4 text-xs text-muted">
          <span>
            {intraday
              ? points.length
                ? `Sesión del ${formatDate(points[0].time)}, cada 5 min, hora de Nueva York`
                : "Cada 5 min, hora de Nueva York"
              : "Cierre de cada día hábil"}
          </span>
          {hasApiKey && (
            <button
              type="button"
              onClick={series.refresh}
              disabled={series.loading}
              className="rounded-full border border-line px-3 py-1 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
            >
              {series.loading ? "Actualizando…" : "Actualizar"}
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
