// Datos de ejemplo para cuando no hay clave de API o la API no responde.
// Se generan con una caminata aleatoria de semilla fija: siempre se ven
// igual para un mismo símbolo, pero NO son precios reales.

const BASE_PRICES = { IBM: 250, AAPL: 240, MSFT: 480, GOOGL: 200 };
const DAILY_VOLATILITY = 0.014;
const INTRADAY_VOLATILITY = 0.0015;

function hash(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, "0");
const round = (n) => Math.round(n * 100) / 100;
const toDateString = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function lastWeekdays(count) {
  const days = [];
  const d = new Date();
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.unshift(toDateString(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

// Mismo formato que Twelve Data: "AAAA-MM-DD" o "AAAA-MM-DD HH:mm:ss".
function timestamps({ interval, outputsize }) {
  if (interval === "1day") return lastWeekdays(outputsize);
  const [day] = lastWeekdays(1);
  return Array.from({ length: outputsize }, (_, i) => {
    const minutes = 9 * 60 + 30 + i * 5;
    return `${day} ${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;
  });
}

// Caminata hacia atrás desde el último precio: así el precio final no
// depende de cuántos puntos se pidan, y las series diaria e intradía coinciden.
function walkBack(random, count, end, volatility) {
  const closes = [end];
  while (closes.length < count) {
    closes.unshift(closes[0] / (1 + (random() - 0.52) * 2 * volatility));
  }
  return closes;
}

function toPoints(times, closes, random, volatility) {
  return times.map((time, i) => {
    const open = closes[Math.max(i - 1, 0)];
    const close = closes[i];
    const spread = close * volatility * random() * 0.5;
    return {
      time,
      close: round(close),
      high: round(Math.max(open, close) + spread),
      low: round(Math.min(open, close) - spread),
    };
  });
}

export function getSampleSeries(symbol, preset) {
  const base = (BASE_PRICES[symbol] ?? 100) + (hash(symbol) % 1000) / 100;
  const times = timestamps(preset);
  const dailyRandom = seededRandom(hash(`${symbol}:1day`));

  if (preset.interval === "1day") {
    const closes = walkBack(dailyRandom, times.length, base, DAILY_VOLATILITY);
    return {
      symbol,
      currency: "USD",
      points: toPoints(times, closes, dailyRandom, DAILY_VOLATILITY),
    };
  }

  // Intradía: arranca en el cierre anterior y termina en el precio actual
  // de la serie diaria, para que el gráfico y el encabezado cuadren.
  const [prevClose, lastClose] = walkBack(dailyRandom, 2, base, DAILY_VOLATILITY);
  const random = seededRandom(hash(`${symbol}:${preset.interval}`));
  const closes = walkBack(random, times.length, lastClose, INTRADAY_VOLATILITY);
  const gap = prevClose - closes[0];
  const bridged = closes.map((c, i) => c + gap * (1 - i / (closes.length - 1)));

  return {
    symbol,
    currency: "USD",
    points: toPoints(times, bridged, random, INTRADAY_VOLATILITY),
  };
}
