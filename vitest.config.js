import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['lib/**/*.js', 'commands/**/*.js'],
      exclude: ['node_modules/**', 'tests/**'],
    },
  },
});
