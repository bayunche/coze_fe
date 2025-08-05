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
      // 价格相关API专用转发规则 - 转发到1207端口
      '/api/backend-api/materials/priceinfo': {
        target: 'http://159.75.127.84:1207',
        changeOrigin: true,
        rewrite: (path) => {
          // 完全移除 /api/backend-api 前缀，只保留 /materials/priceinfo 部分
          const newPath = path.replace(/^\/api\/backend-api/, '')
          console.log(`[/api/backend-api/materials/priceinfo] 路径转换: ${path} -> ${newPath}`)
          console.log(`[/api/backend-api/materials/priceinfo] 最终请求: http://159.75.127.84:1207${newPath}`)
          return newPath
        }
      },
      // 也处理直接 /backend-api/materials/priceinfo 的情况
      '/backend-api/materials/priceinfo': {
        target: 'http://159.75.127.84:1207',
        changeOrigin: true,
        rewrite: (path) => {
          // 保持完整路径，包括/backend-api前缀
          console.log(`[/backend-api/materials/priceinfo] 路径转换: ${path} -> ${path}`)
          console.log(`[/backend-api/materials/priceinfo] 最终请求: http://159.75.127.84:1207${path}`)
          return path
        }
      },
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
