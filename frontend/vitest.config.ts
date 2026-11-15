import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom' },
  resolve: { alias: [{ find: /^(.+)@\d+\.\d+\.\d+$/, replacement: '$1' }] },
  oxc: { jsx: { runtime: 'automatic' } },
});
