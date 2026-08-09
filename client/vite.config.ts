import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true, // Listens on 0.0.0.0
    allowedHosts: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false, // <-- CRITICAL: Allows HTTPS Vite frontend to talk to HTTP Express backend
      },
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
        changeOrigin: true,
        secure: false, // <-- Allows WebSocket connections to pass through
      },
    },
  },
});