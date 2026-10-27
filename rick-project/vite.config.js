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
