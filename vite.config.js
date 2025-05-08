import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [vue(), {
    name: 'copy-redirects',
    closeBundle() {
      const src = path.resolve(__dirname, 'public/_redirects');
      const dest = path.resolve(__dirname, 'dist/_redirects');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✅ Copied _redirects to dist/');
      }
    }
  }],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
