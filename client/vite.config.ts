import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  // Load env variables (checks system env & .env files)
  const env = loadEnv(mode, process.cwd(), "");
  const isDocker = process.env.IS_DOCKER === "true" || env.VITE_IS_DOCKER === "true";

  return {
    plugins: [
      react(),
      tailwindcss(),
      // 🔒 Enable basicSsl ONLY when running locally outside Docker
      ...(!isDocker ? [basicSsl()] : []),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: true, // Listens on 0.0.0.0
      allowedHosts: true,
      port: 5173,
      strictPort: true,

      // 🐳 DOCKER / PROD: Nginx handles SSL and proxying to backend
      ...(isDocker
        ? {
            hmr: {
              clientPort: 443,
              protocol: "wss",
            },
          }
        : // 💻 LOCAL DEV: Vite handles SSL and proxies directly to backend
          {
            proxy: {
              "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
                secure: false,
              },
              "/ws": {
                target: "ws://localhost:8080",
                ws: true,
                changeOrigin: true,
                secure: false,
              },
            },
          }),
    },
  };
});