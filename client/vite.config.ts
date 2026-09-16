import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BASE = '/sample/ai-generate-app/';

export default defineConfig({
  root: path.resolve(__dirname),
  base: BASE,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3092,
    proxy: {
      '/api/chart': {
        target: 'http://127.0.0.1:3093',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/chart/, ''),
      },
      '/sample/ai-generate-app/api': {
        target: 'http://127.0.0.1:3093',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sample\/ai-generate-app\/api/, ''),
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    emptyOutDir: true,
  },
});
