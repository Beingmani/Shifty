import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
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
