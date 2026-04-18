import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const devProxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8081'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: devProxyTarget, changeOrigin: true },
      '/tickets': { target: devProxyTarget, changeOrigin: true },
      '/assignments': { target: devProxyTarget, changeOrigin: true },
      '/oauth2': { target: devProxyTarget, changeOrigin: true },
      '/login/oauth2': { target: devProxyTarget, changeOrigin: true },
    },
  },
})
