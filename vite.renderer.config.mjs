import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@assets': resolve(import.meta.dirname, 'assets'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        settings: resolve(import.meta.dirname, 'settings.html'),
        switcher: resolve(import.meta.dirname, 'switcher.html'),
        toast: resolve(import.meta.dirname, 'toast.html'),
        menubar: resolve(import.meta.dirname, 'menubar.html'),
      },
    },
  },
});
