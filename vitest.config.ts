import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '.cache/vitest',
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    fsModuleCachePath: '.cache/vitest/modules',
    environment: 'node',
    include: ['app/**/*.test.{ts,tsx}', 'tests/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
