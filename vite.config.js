import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// El servidor de desarrollo solo escucha en este computador. Para probar
// desde el celular en la misma red, usar temporalmente: npm run dev -- --host
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
