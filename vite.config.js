import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  base: '/', // ✅ Recommended for SPA
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist'
  },
  server: {
    historyApiFallback: true // ✅ Handles SPA routes in dev
  }
});
