import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    alias: {
      $lib: './src/lib',
      $routes: './src/routes'
    }
  }
});