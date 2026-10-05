// Chart.js dibuja en canvas y no lee clases de Tailwind: toma los colores de
// las variables CSS del tema activo (definidas en index.css), así quedan
// definidos en un solo lugar.
const NAMES = ["ink", "muted", "surface", "raised", "line", "up", "down", "guide"];

export function getChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    NAMES.map((name) => [name, styles.getPropertyValue(`--color-${name}`).trim()])
  );
}

let probe;

// Devuelve el color con transparencia. Acepta cualquier formato CSS que
// entienda el canvas (hex corto o largo, rgb, nombres).
export function withAlpha(color, alpha) {
  probe ??= document.createElement("canvas").getContext("2d");
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  const hex = probe.fillStyle;
  if (!hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
