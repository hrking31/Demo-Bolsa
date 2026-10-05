import { useTranslation } from "react-i18next";

const LABEL_KEYS = {
  sample: "source.sample",
  cache: "source.cache",
};

// Indica cuando lo que se ve no viene en vivo de la API.
export default function SourceBadge({ source }) {
  const { t } = useTranslation();
  const key = LABEL_KEYS[source];
  if (!key) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-warn/15 px-2 py-0.5 text-xs font-medium text-warn">
      {t(key)}
    </span>
  );
}
