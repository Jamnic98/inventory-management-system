/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    testTimeout: 40000,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
});
