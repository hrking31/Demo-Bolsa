import { useCallback, useEffect, useRef, useState } from "react";
import { loadSeries } from "../services/twelveData";

/**
 * Carga una serie de precios y expone { data, source, error, loading, refresh }.
 * Solo devuelve datos que correspondan al símbolo e intervalo actuales, así
 * una respuesta lenta de una consulta anterior nunca se muestra por error.
 */
export function useTimeSeries(symbol, preset) {
  const key = `${symbol}:${preset.interval}`;
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const forceRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    const force = forceRef.current;
    forceRef.current = false;

    loadSeries(symbol, preset, { force }).then((res) => {
      if (ignore) return;
      setResult({ key, ...res });
      setRefreshing(false);
    });

    return () => {
      ignore = true;
    };
  }, [key, symbol, preset, reloadCount]);

  const refresh = useCallback(() => {
    forceRef.current = true;
    setRefreshing(true);
    setReloadCount((n) => n + 1);
  }, []);

  const current = result?.key === key ? result : null;
  return {
    data: current?.data ?? null,
    source: current?.source ?? null,
    error: current?.error ?? null,
    loading: !current || refreshing,
    refresh,
  };
}
