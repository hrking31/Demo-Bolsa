import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StockChart({ symbol, apiKey, setError }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState(null);

  const fetchData = async () => {
    if (!symbol) return;
    setLoading(true);
    setLocalError(null);
    setError(null);

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data["Error Message"] || data["Information"]) {
        const errorMsg = data["Error Message"] || data["Information"];
        setLocalError(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      const timeSeries = data["Time Series (5min)"];
      if (!timeSeries) {
        const errorMsg = "No se encontraron datos históricos.";
        setLocalError(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      const labels = Object.keys(timeSeries).reverse();
      const values = labels.map((t) => parseFloat(timeSeries[t]["4. close"]));
      setChartData({
        labels,
        datasets: [
          {
            label: `Precio de Cierre (${symbol})`,
            data: values,
            borderColor: "#3B82F6",
            fill: false,
            tension: 0.3,
          },
        ],
      });
    } catch (error) {
      const errorMsg = "Error al conectar con la API.";
      setLocalError(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, apiKey, setError]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
      title: {
        display: true,
        text: `Precios Intradiarios de ${symbol} (5min)`,
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: "Fecha y Hora", font: { size: 12 } },
        ticks: { font: { size: 10 }, maxTicksLimit: 10 },
      },
      y: {
        display: true,
        title: { display: true, text: "Precio (USD)", font: { size: 12 } },
        ticks: { font: { size: 10 } },
      },
    },
  };

  return (
    <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full sm:max-w-4xl mx-auto">
      {loading && (
        <p className="text-center text-gray-500 text-sm sm:text-base">
          Cargando datos...
        </p>
      )}
      {localError && (
        <p className="text-center text-red-500 mb-4 text-sm sm:text-base line-clamp-2">
          {localError.includes("rate limit") ? (
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
            localError
          )}
        </p>
      )}
      {!loading && !localError && chartData.labels.length > 0 && (
        <>
          <div className="h-[250px] sm:h-[400px] w-full">
            <Line data={chartData} options={options} />
          </div>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mx-auto block text-sm sm:text-base"
          >
            Actualizar Datos
          </button>
        </>
      )}
      {!loading && !localError && chartData.labels.length === 0 && (
        <p className="text-center text-gray-500 text-sm sm:text-base">
          No hay datos disponibles
        </p>
      )}
    </div>
  );
}
