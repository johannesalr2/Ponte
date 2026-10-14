/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { validateContent } from './src/content/validate';
import { readContentDir } from './scripts/read-content';

const contentDir = fileURLToPath(new URL('./content', import.meta.url));

/** Valida /content com Zod: falha o build; no dev mostra erros no terminal. */
function contentValidation(): Plugin {
  let isBuild = false;
  const run = (fail: (msg: string) => void, warn: (msg: string) => void) => {
    const report = validateContent(readContentDir(contentDir));
    report.warnings.forEach((w) => warn(`conteúdo: ${w}`));
    if (report.errors.length) fail(`Conteúdo inválido:\n${report.errors.join('\n')}`);
  };
  return {
    name: 'ponte-content-validation',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    buildStart() {
      run(
        (msg) => (isBuild ? this.error(msg) : this.warn(msg)),
        (msg) => this.warn(msg),
      );
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(contentDir)) return;
      run(
        (msg) => server.config.logger.error(msg),
        (msg) => server.config.logger.warn(msg),
      );
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': contentDir,
    },
  },
  plugins: [
    contentValidation(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ponte Técnica',
        short_name: 'Ponte',
        description: 'Vocabulário técnico da sua profissão, do alemão para o português.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f4ee',
        theme_color: '#0b4f6c',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
