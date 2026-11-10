import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/r': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
