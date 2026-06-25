import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function electronIndexHtml(): Plugin {
  return {
    name: 'electron-index-html',
    transformIndexHtml(html) {
      // file:// loads fail in Electron when Vite adds crossorigin to module scripts.
      return html.replace(/\s+crossorigin(="anonymous")?/g, '')
    },
  }
}

const devPort = Number(process.env.VITE_DEV_PORT ?? 5173)
const useDocker = process.env.VITE_DOCKER === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), electronIndexHtml()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: devPort,
    host: useDocker ? '0.0.0.0' : undefined,
    strictPort: useDocker,
    watch: useDocker ? { usePolling: true, interval: 1000 } : undefined,
    hmr: useDocker ? { clientPort: devPort } : undefined,
  },
})
