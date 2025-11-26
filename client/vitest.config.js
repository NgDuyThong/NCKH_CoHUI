import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    css: true,
    // Exclude E2E tests - chúng sẽ chạy bằng Playwright
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/test/e2e/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.js',
        'src/main.jsx',
        'src/data/',
        'dist/'
      ],
      include: [
        'src/utils/**/*.js',
        'src/components/**/*.jsx',
        'src/pages/**/*.jsx'
      ],
      all: true,
      lines: 75,
      functions: 75,
      branches: 70,
      statements: 75
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
