import { useState } from "react";
import StockCard from "./Components/StockCard/StockCard";
import StockChart from "./Components/StockChart/StockChart";

const symbols = ["IBM", "AAPL", "MSFT", "GOOGL"];
const DEFAULT_API_KEY = "demo";

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [error, setError] = useState(null);

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    setError(null);
  };

  // Solo se aplica la clave cuando el usuario confirma (botón o Enter),
  // y luego se vacía el campo para no dejarla expuesta en pantalla.
  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    setApiKey(inputValue.trim() || DEFAULT_API_KEY);
    setInputValue("");
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
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            Obtén tu clave aquí
          </a>
        </div>
        <form onSubmit={handleApiKeySubmit} className="mt-1 flex gap-2">
          <input
            id="apiKey"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ingresa tu clave de API (o usa 'demo')"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
          >
            Enter
          </button>
        </form>
        <p className="mt-1 text-xs text-gray-500">
          {apiKey === DEFAULT_API_KEY
            ? "Usando la clave de demostración."
            : "Usando tu clave personalizada."}
        </p>
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
