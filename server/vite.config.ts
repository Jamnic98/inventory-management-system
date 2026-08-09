import { defineConfig } from 'vite';

export default defineConfig(
  {
  server: {
    host: true,
  },
  resolve: {
    tsconfigPaths: true
  },
});
