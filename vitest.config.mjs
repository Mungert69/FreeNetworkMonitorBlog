import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  oxc: {
    include: /\.[cm]?[jt]sx?$/,
    exclude: [],
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [
    react({
      include: /\.[jt]sx?$/,
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup-ui.js'],
    include: ['tests/ui/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@layouts': path.resolve(__dirname, 'layouts'),
      '@components': path.resolve(__dirname, 'layouts/components'),
      '@partials': path.resolve(__dirname, 'layouts/partials'),
      '@shortcodes': path.resolve(__dirname, 'layouts/shortcodes'),
      '@config': path.resolve(__dirname, 'config'),
      '@json': path.resolve(__dirname, 'json'),
      '@hooks': path.resolve(__dirname, 'hooks'),
      '@lib': path.resolve(__dirname, 'lib'),
    },
  },
});
