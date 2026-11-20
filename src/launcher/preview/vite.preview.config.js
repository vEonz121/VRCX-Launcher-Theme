import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

const srcDir = resolve(import.meta.dirname, '../..');

/**
 * Stand-alone browser preview of the launcher UI with mock data.
 * npm run preview:launcher        → dev server on http://localhost:9100/launcher/preview/index.html
 * npm run build:launcher-preview  → static files in build/launcher-preview
 */
export default defineConfig({
    // root is src/ so Tailwind scans the shared UI components too
    root: srcDir,
    base: '',
    plugins: [vue(), tailwindcss()],
    resolve: { alias: { '@': srcDir } },
    define: { VERSION: '"preview"', NIGHTLY: 'false', WINDOWS: 'false', LINUX: 'false' },
    server: { port: 9100, open: '/launcher/preview/index.html' },
    build: {
        outDir: resolve(srcDir, '../build/launcher-preview'),
        emptyOutDir: true,
        target: 'chrome120',
        assetsInlineLimit: 0,
        rolldownOptions: { input: resolve(import.meta.dirname, 'index.html') }
    }
});
