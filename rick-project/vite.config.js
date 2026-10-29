import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/rm-api': {
        target: 'https://rickandmortyapi.com/api',
        changeOrigin: true,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        rewrite: (path) => {
          const stripped = path.replace(/^\/rm-api/, '')
          return stripped.replace(/^\/places/, '/location')
        },
      },
    },
  },
  preview: {
    proxy: {
      '/rm-api': {
        target: 'https://rickandmortyapi.com/api',
        changeOrigin: true,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        rewrite: (path) => {
          const stripped = path.replace(/^\/rm-api/, '')
          return stripped.replace(/^\/places/, '/location')
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
