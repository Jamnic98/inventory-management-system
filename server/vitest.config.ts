/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv'

// Load environment variables before running tests
dotenv.config()

export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
  resolve: {
    tsconfigPaths: true
  },
});
