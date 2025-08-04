import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// element-plus
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
          directives: true,
          version: '2.1.5'
        })
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/style/element/index.scss" as *;`
      }
    }
  },
  server: {
    proxy: {
      '/api/backend-api': {
        target: 'http://159.75.127.84:1202',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/backend-api/, '')
          console.log(`[/api/backend-api] 路径转换: ${path} -> ${newPath}`)
          console.log(`[/api/backend-api] 最终请求: http://159.75.127.84:1202${newPath}`)
          return newPath
        }
      },
      '/api': {
        target: 'http://159.75.127.84:1207',
        changeOrigin: true,
        rewrite: (path) => {
          // 不移除/api前缀，保持完整路径
          console.log(`[/api] 路径转换: ${path} -> ${path}`)
          console.log(`[/api] 最终请求: http://159.75.127.84:1207${path}`)
          return path
        }
      },
      '/backend-api': {
        target: 'http://159.75.127.84:1202',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/backend-api/, '')
          console.log(`[/backend-api] 路径转换: ${path} -> ${newPath}`)
          console.log(`[/backend-api] 最终请求: http://159.75.127.84:1202${newPath}`)
          return newPath
        }
      }
    }
  }
})
