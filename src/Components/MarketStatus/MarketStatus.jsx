import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isUsMarketOpen } from "../../utils/market";

export default function MarketStatus() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => isUsMarketOpen());

  useEffect(() => {
    const id = setInterval(() => setOpen(isUsMarketOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      className="flex items-center gap-2 text-sm text-muted"
      title={t("market.hours")}
    >
      <span className="relative flex size-2.5">
        {open && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-60" />
        )}
        <span
          className={`relative inline-flex size-2.5 rounded-full ${
            open ? "bg-up" : "bg-muted/50"
          }`}
        />
      </span>
      {open ? t("market.open") : t("market.closed")}
    </p>
  );
}
