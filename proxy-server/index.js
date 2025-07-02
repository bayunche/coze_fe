const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 3001 // 前端和代理服务器监听的端口
const BACKEND_TARGET = 'http://159.75.127.84:1207' // 后端实际地址

// 允许所有来源的跨域请求
app.use(cors())

// 提供前端静态文件
// 假设前端打包后的文件在项目根目录的 'dist' 文件夹中
const frontendDistPath = path.join(__dirname, '..', 'dist')
app.use(express.static(frontendDistPath))

// 配置代理
app.use(
  '/materials',
  createProxyMiddleware({
    target: BACKEND_TARGET,
    changeOrigin: true,
    pathRewrite: {
      '^/materials': '/materials'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying request from ${req.originalUrl} to ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`
      )
      // 可以添加或修改请求头
    },
    onProxyRes: (proxyRes, req, res) => {
      // 可以修改响应头
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err)
      res.status(500).send('Proxy Error')
    }
  })
)

// 对于所有未匹配的路由，返回 index.html，以支持单页应用路由
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'))
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`Frontend and proxy server listening on port ${PORT}`)
  console.log(`Serving frontend from: ${frontendDistPath}`)
  console.log(`Proxying requests for /materials to ${BACKEND_TARGET}`)
})
