import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'CoIUM/',
        'uploads/'
      ],
      include: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middlewares/**/*.js',
        'utils/**/*.js'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
