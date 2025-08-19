# 生产环境部署指南

## 概述

本项目采用 **单体部署 + Nginx反向代理** 的方案，解决生产环境中前端无法访问localhost端口的问题。

## 架构说明

```
用户浏览器
    ↓ (访问 http://server-ip/)
   Nginx (端口80)
    ├─ / → 静态前端文件
    ├─ /api/* → Java服务 (端口1207)
    └─ /backend-api/* → Java服务 (端口1202)
```

## 部署前准备

### 1. 环境依赖
- Docker & Docker Compose
- Node.js & npm/yarn (用于构建)
- Java服务运行在1202和1207端口

### 2. 检查Java服务
确保以下服务正在运行：
```bash
# 检查1207端口 (主要业务API)
curl http://localhost:1207/health

# 检查1202端口 (对话流API)  
curl http://localhost:1202/health
```

## 快速部署

### 方式1：使用部署脚本（推荐）
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

**注意事项**:
- 脚本已配置UTF-8编码，自动适配Mac/Linux/Windows环境
- Windows环境下建议使用Git Bash或WSL执行脚本
- 如仍有乱码问题:
  - Windows: `chcp 65001`
  - Mac: `export LANG=zh_CN.UTF-8`
  - Linux: `export LANG=zh_CN.UTF-8`

### 方式2：手动部署
```bash
# 1. 安装依赖
yarn install

# 2. 构建生产版本
yarn build-prod

# 3. 启动服务
docker-compose up -d frontend
```

## 配置说明

### Nginx配置 (`nginx/nginx.conf`)
- **前端服务**: 静态文件托管，支持SPA路由
- **API转发**: `/api/*` → `localhost:1207/*`
- **工作流转发**: `/backend-api/*` → `localhost:1202/*`
- **CORS处理**: 自动添加跨域响应头
- **流式响应**: 支持对话流的流式传输

### 环境配置 (`.env.production`)
```env
VITE_APP_BASE_API=/api
VITE_APP_BACKEND_WORKFLOW_API=/backend-api
```

## 服务管理

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有日志
docker-compose logs -f

# 查看Nginx日志
docker-compose logs -f frontend

# 查看Nginx访问日志
tail -f nginx/logs/access.log
```

### 重启服务
```bash
docker-compose restart frontend
```

### 停止服务
```bash
docker-compose down
```

## 访问地址

- **前端应用**: `http://your-server-ip/`
- **健康检查**: `http://your-server-ip/health`
- **API测试**: `http://your-server-ip/api/`

## 故障排查

### 1. 服务无法启动
```bash
# 检查端口占用
netstat -tlnp | grep :80

# 检查Docker服务
docker-compose ps
docker-compose logs frontend
```

### 2. API请求失败
```bash
# 检查Java服务状态
curl http://localhost:1207/health
curl http://localhost:1202/health

# 检查Nginx转发
curl http://localhost/api/health
curl http://localhost/backend-api/health
```

### 3. 前端页面空白
- 检查 `dist/` 目录是否存在且不为空
- 检查浏览器控制台是否有JS错误
- 检查Nginx配置中的root路径

## 性能优化

### 1. 静态资源缓存
Nginx已配置静态资源缓存（JS/CSS/图片等）

### 2. Gzip压缩
已启用Gzip压缩减少传输体积

### 3. 健康检查
提供 `/health` 端点用于负载均衡器健康检查

## 扩展部署

### 使用自定义域名
修改 `nginx/nginx.conf` 中的 `server_name`:
```nginx
server_name your-domain.com;
```

### 启用HTTPS
1. 获取SSL证书
2. 修改Nginx配置添加SSL配置
3. 将端口改为443

### 集群部署
如需集群部署，可以：
1. 使用Docker Swarm或Kubernetes
2. 配置负载均衡器
3. 共享存储静态文件

## 注意事项

1. **端口配置**: 确保1202和1207端口的Java服务正常运行
2. **防火墙**: 开放80端口供外部访问
3. **资源限制**: 根据实际情况调整Docker容器资源限制
4. **日志轮转**: 定期清理Nginx日志文件
5. **备份**: 定期备份配置文件和应用数据