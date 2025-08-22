import { useState } from "react";
import StockCard from "./Components/StockCard/StockCard";
import StockChart from "./Components/StockChart/StockChart";

const symbols = ["IBM", "AAPL", "MSFT", "GOOGL"];
const DEFAULT_API_KEY = "demo";

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [error, setError] = useState(null);

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    setError(null);
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value || DEFAULT_API_KEY);
    setError(null);
    setSelectedSymbol(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
        Demo Bolsa
      </h1>
      <div className="mb-4 sm:mb-6 max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700"
          >
            Clave de API de Alpha Vantage
          </label>
          <a
            href="https://www.alphavantage.co/premium/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            Obtén tu clave aquí
          </a>
        </div>
        <input
          id="apiKey"
          type="text"
          value={apiKey === DEFAULT_API_KEY ? "" : apiKey}
          onChange={handleApiKeyChange}
          placeholder="Ingresa tu clave de API (o usa 'demo')"
          className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && (
        <p className="text-red-500 text-center mb-4 sm:mb-6 text-sm sm:text-base line-clamp-2">
          {error.includes("rate limit") ? (
            <>
              {error} Visita{" "}
              <a
                href="https://www.alphavantage.co/premium/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500"
              >
                Alpha Vantage Premium
              </a>{" "}
              para más solicitudes.
            </>
          ) : (
            error
          )}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 sm:gap-4 mb-6">
        {symbols.map((sym, index) => (
          <StockCard
            key={sym}
            symbol={sym}
            onSelect={handleSelect}
            selected={selectedSymbol === sym}
            apiKey={apiKey}
            fetchDelay={index * 1000}
          />
        ))}
      </div>
      {!selectedSymbol && (
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
          Toca una tarjeta para ver los precios intradiarios
        </p>
      )}
      {selectedSymbol && (
        <StockChart
          symbol={selectedSymbol}
          apiKey={apiKey}
          setError={setError}
        />
      )}
    </div>
  );
}
