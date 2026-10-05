const priceFormatters = new Map();

export function formatPrice(value, currency = "USD") {
  if (!priceFormatters.has(currency)) {
    priceFormatters.set(
      currency,
      new Intl.NumberFormat("en-US", { style: "currency", currency })
    );
  }
  return priceFormatters.get(currency).format(value);
}

export const formatPercent = (value) =>
  `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export const percentChange = (from, to) => ((to - from) / from) * 100;

// Las fechas llegan como "AAAA-MM-DD" o "AAAA-MM-DD HH:mm:ss" (hora de Nueva York).
export const formatTime = (datetime) => datetime.slice(11, 16);

export function formatDate(datetime) {
  const [y, m, d] = datetime.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatShortDate(datetime) {
  const [, m, d] = datetime.slice(0, 10).split("-");
  return `${d}/${m}`;
}
