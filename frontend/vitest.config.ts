import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom' },
  oxc: { jsx: { runtime: 'automatic' } },
});
