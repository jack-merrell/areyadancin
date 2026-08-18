import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        info: resolve(__dirname, 'info.html'),
        fund: resolve(__dirname, 'gifts.html'),
      },
    },
  },
});
