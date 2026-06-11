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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), electronIndexHtml()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
