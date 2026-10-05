const LABELS = {
  sample: "Datos de ejemplo",
  cache: "Datos guardados",
};

// Indica cuando lo que se ve no viene en vivo de la API.
export default function SourceBadge({ source }) {
  const label = LABELS[source];
  if (!label) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
      {label}
    </span>
  );
}
