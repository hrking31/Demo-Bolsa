import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function StockCard({
  symbol,
  onSelect,
  selected,
  apiKey,
  fetchDelay,
}) {
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [miniData, setMiniData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Consulta GLOBAL_QUOTE
      const urlQuote = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const resQuote = await fetch(urlQuote);
      const dataQuote = await resQuote.json();
      if (dataQuote["Error Message"] || dataQuote["Information"]) {
        setError(dataQuote["Error Message"] || dataQuote["Information"]);
        setLoading(false);
        return;
      }
      const quote = dataQuote["Global Quote"];
      if (!quote || !quote["05. price"]) {
        setError("No se encontraron datos de cotización.");
        setLoading(false);
        return;
      }
      setPrice(parseFloat(quote["05. price"]));
      setChange(parseFloat(quote["10. change percent"]));

      // Consulta TIME_SERIES_INTRADAY
      const urlHistory = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
      const resHistory = await fetch(urlHistory);
      const dataHistory = await resHistory.json();
      if (dataHistory["Error Message"] || dataHistory["Information"]) {
        setError(dataHistory["Error Message"] || dataHistory["Information"]);
        setLoading(false);
        return;
      }
      const timeSeries = dataHistory["Time Series (5min)"];
      if (!timeSeries) {
        setError("No se encontraron datos históricos.");
        setLoading(false);
        return;
      }
      const labels = Object.keys(timeSeries).reverse().slice(0, 20);
      const values = labels.map((t) => parseFloat(timeSeries[t]["4. close"]));
      setMiniData({
        labels,
        datasets: [
          {
            data: values,
            borderColor: "#34D399",
            fill: false,
            tension: 0.3,
          },
        ],
      });
    } catch (error) {
      setError("Error al conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, fetchDelay || 0);
    return () => clearTimeout(timer);
  }, [symbol, apiKey, fetchDelay]);

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => onSelect(symbol)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect(symbol);
          }
        }}
        role="button"
        tabIndex={0}
        className={`bg-white shadow-md rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-500 border-2 ${
          selected ? "border-blue-500 animate-pulse" : "border-transparent"
        } w-full max-w-[150px] sm:max-w-xs`}
      >
        <h2 className="font-bold text-base sm:text-lg text-center">{symbol}</h2>
        {loading && (
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Cargando...
          </p>
        )}
        {!loading && !error && price !== null && (
          <p
            className={`text-base sm:text-xl text-center ${
              change >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            ${price.toFixed(2)} ({change.toFixed(2)}%)
          </p>
        )}
        {!loading && !error && miniData.labels.length > 0 && (
          <div className="h-16 sm:h-20 mt-2">
            <Line
              data={miniData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 text-center mt-1 sm:mt-2">
          Toca para ver precios intradiarios
        </p>
      </div>
      {error && (
        <p className="text-red-500 text-xs text-center mt-2 max-w-[150px] sm:max-w-xs line-clamp-2">
          {error.includes("rate limit") ? (
            <>
              Límite de API alcanzado. Visita{" "}
              <a
                href="https://www.alphavantage.co/premium/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500"
              >
                Alpha Vantage
              </a>
            </>
          ) : (
            error
          )}
        </p>
      )}
      {!loading && !error && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchData();
          }}
          className="mt-2 text-xs sm:text-sm text-blue-500 hover:underline px-2 py-1"
        >
          Actualizar
        </button>
      )}
    </div>
  );
}
