import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// element-plus
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      // 价格相关API特殊处理 - 转发到专门的价格API服务器
      '/api/backend-api/materials/priceinfo': {
        target: env.VITE_PRICE_API_TARGET || 'http://10.1.17.83:1207',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/backend-api/, '')
          console.log(`[PriceAPI] 路径转换: ${path} -> ${newPath}`)
          console.log(`[PriceAPI] 最终请求: ${env.VITE_PRICE_API_TARGET}${newPath}`)
          return newPath
        }
      },
      '/backend-api/materials/priceinfo': {
        target: env.VITE_PRICE_API_TARGET || 'http://10.1.17.83:1207',
        changeOrigin: true,
        rewrite: (path) => {
          console.log(`[PriceAPI-Direct] 路径转换: ${path} -> ${path}`)
          console.log(`[PriceAPI-Direct] 最终请求: ${env.VITE_PRICE_API_TARGET}${path}`)
          return path
        }
      },
      // 后端API转发 - /api/backend-api 前缀
      '/api/backend-api': {
        target: env.VITE_BACKEND_API_TARGET || 'http://10.1.17.83:1202',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/backend-api/, '')
          console.log(`[BackendAPI] 路径转换: ${path} -> ${newPath}`)
          console.log(`[BackendAPI] 最终请求: ${env.VITE_BACKEND_API_TARGET}${newPath}`)
          return newPath
        }
      },
      // 直接backend-api转发
      '/backend-api': {
        target: env.VITE_BACKEND_API_TARGET || 'http://10.1.17.83:1202',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/backend-api/, '')
          console.log(`[BackendAPI-Direct] 路径转换: ${path} -> ${newPath}`)
          console.log(`[BackendAPI-Direct] 最终请求: ${env.VITE_BACKEND_API_TARGET}${newPath}`)
          return newPath
        }
      },
      // 通用API转发 - /api 前缀
      '/api': {
        target: env.VITE_API_TARGET || 'http://10.1.17.83:1207',
        changeOrigin: true,
        rewrite: (path) => {
          // 保持 /api 前缀，不移除
          console.log(`[API] 路径保持: ${path}`)
          console.log(`[API] 最终请求: ${env.VITE_API_TARGET}${path}`)
          return path
        }
      }
    }
  }
  }
})
