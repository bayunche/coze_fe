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
      // 增加请求体大小限制，支持大文件上传（1000MB）
      maxRequestSize: '1000mb',
      proxy: {
        // 甲供物资相关API转发到1207端口（去掉/api前缀） - 优先级最高
        '/api/materials/partya': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000, // 5分钟超时
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/api/, '')
            console.log(`[OwnerMaterial] 路径转换: ${path} -> ${newPath}`)
            console.log(`[OwnerMaterial] 最终请求: ${env.VITE_API_TARGET}${newPath}`)
            return newPath
          }
        },
        // 乙供物资v2 API转发到1207端口
        '/api/materials/priceinfo': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000, // 5分钟超时
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/api/, '')
            console.log(`[SupplierMaterialV2] 路径转换: ${path} -> ${newPath}`)
            console.log(`[SupplierMaterialV2] 最终请求: ${env.VITE_API_TARGET}${newPath}`)
            return newPath
          }
        },
        '/api/materials/partyb': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000, // 5分钟超时
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/api/, '')
            console.log(`[OwnerMaterial] 路径转换: ${path} -> ${newPath}`)
            console.log(`[OwnerMaterial] 最终请求: ${env.VITE_API_TARGET}${newPath}`)
            return newPath
          }
        },
        // 价格相关API特殊处理 - 转发到专门的价格API服务器
        '/api/backend-api/materials/priceinfo': {
          target: env.VITE_PRICE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          // 支持大文件上传的配置
          timeout: 300000, // 5分钟超时
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/api\/backend-api/, '')
            console.log(`[PriceAPI] 路径转换: ${path} -> ${newPath}`)
            console.log(`[PriceAPI] 最终请求: ${env.VITE_PRICE_API_TARGET}${newPath}`)
            return newPath
          }
        },
        '/backend-api/materials/priceinfo': {
          target: env.VITE_PRICE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => {
            console.log(`[PriceAPI-Direct] 路径转换: ${path} -> ${path}`)
            console.log(`[PriceAPI-Direct] 最终请求: ${env.VITE_PRICE_API_TARGET}${path}`)
            return path
          }
        },
        // 后端API转发 - /api/backend-api 前缀
        '/api/backend-api': {
          target: env.VITE_BACKEND_API_TARGET || 'http://192.168.1.103:1202',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/api\/backend-api/, '')
            console.log(`[BackendAPI] 路径转换: ${path} -> ${newPath}`)
            console.log(`[BackendAPI] 最终请求: ${env.VITE_BACKEND_API_TARGET}${newPath}`)
            return newPath
          }
        },
        // 直接backend-api转发
        '/backend-api': {
          target: env.VITE_BACKEND_API_TARGET || 'http://192.168.1.103:1202',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => {
            const newPath = path.replace(/^\/backend-api/, '')
            console.log(`[BackendAPI-Direct] 路径转换: ${path} -> ${newPath}`)
            console.log(`[BackendAPI-Direct] 最终请求: ${env.VITE_BACKEND_API_TARGET}${newPath}`)
            return newPath
          }
        },
        // 乙供物资解析相关API转发到1207端口（不带/api前缀）
        '/materials/partyb': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000, // 5分钟超时
          proxyTimeout: 300000,
          rewrite: (path) => {
            console.log(`[SupplierMaterial] 路径保持: ${path}`)
            console.log(`[SupplierMaterial] 最终请求: ${env.VITE_API_TARGET}${path}`)
            return path
          }
        },
        // 物资基础信息查询API转发到1207端口（带/api前缀）
        '/api/materials/base-info': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => {
            console.log(`[MaterialBaseInfo] 路径保持: ${path}`)
            console.log(`[MaterialBaseInfo] 最终请求: ${env.VITE_API_TARGET}${path}`)
            return path
          }
        },
        // 临时价格信息相关API转发到1207端口（不带/api前缀）
        '/materials/priceinfo/temporary': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          rewrite: (path) => {
            console.log(`[TemporaryPriceInfo] 路径保持: ${path}`)
            console.log(`[TemporaryPriceInfo] 最终请求: ${env.VITE_API_TARGET}${path}`)
            return path
          }
        },
        // 通用API转发 - /api 前缀（文件上传主要使用此路径） - 优先级最低
        '/api': {
          target: env.VITE_API_TARGET || 'http://192.168.1.103:1207',
          changeOrigin: true,
          // 专门为文件上传配置大文件支持
          timeout: 600000, // 10分钟超时，支持大文件上传
          proxyTimeout: 600000,
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
