import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia') || id.includes('node_modules/vue-router')) {
            return 'framework'
          }
          if (
            id.includes('node_modules/markdown-it') ||
            id.includes('node_modules/unified') ||
            id.includes('node_modules/remark-parse') ||
            id.includes('node_modules/remark-stringify') ||
            id.includes('node_modules/mdast-util-to-string')
          ) {
            return 'markdown'
          }
          if (
            id.includes('node_modules/vuedraggable') ||
            id.includes('node_modules/lucide-vue-next') ||
            id.includes('node_modules/@vueuse/core')
          ) {
            return 'ui'
          }
          if (id.includes('node_modules/idb')) {
            return 'storage'
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**/*.ts', 'src/persistence/**/*.ts'],
    },
  },
})
