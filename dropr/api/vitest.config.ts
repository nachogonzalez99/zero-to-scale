import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        // Whole service: just below today's figures, so coverage cannot silently drop.
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
        // Business modules: every line and every branch is tested.
        'src/modules/**/*.ts': { 100: true },
      },
    },
  },
});
