import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// Build version: 2026-02-03
export default defineConfig({
  base: '/', // ✅ Recommended for SPA
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'chart.js', 'vue-chartjs']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure unique chunk names with content hash for better cache invalidation
    rollupOptions: {
      output: {
        // Include hash in entry file names
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    historyApiFallback: true // ✅ Handles SPA routes in dev
  }
});