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
    outDir: 'dist',
    sourcemap: false, // 🛑 Added to disable source maps
    esbuild: {
      drop: ['console', 'debugger'], // 🛑 Added to remove console and debugger statements
    },
  },
  server: {
    historyApiFallback: true // ✅ Handles SPA routes in dev
  }
});