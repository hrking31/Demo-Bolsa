import { useCallback, useState } from "react";

const STORAGE_KEY = "demo-bolsa:theme";

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.dataset.theme = theme;
  window.setTimeout(() => root.classList.remove("theme-transition"), 400);

  const paper = getComputedStyle(root).getPropertyValue("--color-paper").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", paper);
}

// El tema inicial lo fija public/theme-init.js antes de que cargue React.
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark"
  );

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    // Se aplica antes de volver a renderizar, para que el gráfico lea ya
    // los colores del tema nuevo.
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento disponible: el tema no se recuerda.
    }
  }, [theme]);

  return { theme, toggle };
}
