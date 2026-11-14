import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'node:fs';

const { redirects } = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));

// Match the legacy-page redirects locally as well as on Vercel.
function legacyRedirects(server) {
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/$/, '').replace(/\.html$/, '');
    const redirect = redirects.find(({ source }) => source === path);
    if (!redirect) return next();
    res.writeHead(308, { Location: redirect.destination + url.search });
    res.end();
  });
}

export default defineConfig({
  plugins: [react(), {
    name: 'legacy-page-redirects',
    configureServer: legacyRedirects,
    configurePreviewServer: legacyRedirects,
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        invite: resolve(__dirname, 'invite.html'),
        info: resolve(__dirname, 'invite/info.html'),
        fund: resolve(__dirname, 'invite/gifts.html'),
      },
    },
  },
});
