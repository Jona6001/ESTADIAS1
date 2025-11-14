import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // Para Railway, usar raíz
  build: {
    outDir: "dist", // Directorio estándar para Railway
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "estadias-front-production.up.railway.app",
      ".up.railway.app",
      "localhost"
    ]
  },
  plugins: [react()],
});
