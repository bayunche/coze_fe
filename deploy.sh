#!/bin/bash

# 生产环境部署脚本
# 用于构建前端应用并启动Nginx反向代理服务
# 文件编码: UTF-8

set -e  # 遇到错误时退出

# 设置控制台输出编码为UTF-8，兼容Mac和Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac环境
    export LANG=zh_CN.UTF-8
    export LC_ALL=zh_CN.UTF-8
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux环境
    export LANG=zh_CN.UTF-8
    export LC_ALL=zh_CN.UTF-8
else
    # 其他环境(包括Windows WSL)
    export LANG=C.UTF-8
    export LC_ALL=C.UTF-8
fi

echo "=== 五模二算前端应用部署脚本 ==="

# 1. 检查依赖
echo "1. 检查部署依赖..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"

# 2. 清理旧的构建文件
echo "2. 清理旧的构建文件..."
rm -rf dist/
rm -rf nginx/logs/
mkdir -p nginx/logs

# 3. 安装依赖
echo "3. 安装项目依赖..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# 4. 构建生产版本
echo "4. 构建生产版本..."
if command -v yarn &> /dev/null; then
    yarn build-prod
else
    npm run build-prod
fi

# 5. 检查构建结果
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "❌ 构建失败，dist目录不存在或为空"
    exit 1
fi

echo "✅ 前端构建完成"

# 6. 启动服务
echo "5. 启动 Docker 服务..."
docker-compose down --remove-orphans
docker-compose up -d frontend

# 7. 等待服务启动
echo "6. 等待服务启动..."
sleep 5

# 8. 健康检查
echo "7. 健康检查..."
if curl -f http://localhost/health &> /dev/null; then
    echo "✅ 服务健康检查通过"
else
    echo "⚠️ 服务可能未完全启动，请检查日志"
fi

# 9. 显示服务信息
echo ""
echo "=== 部署完成 ==="
echo "🌐 前端应用: http://localhost"
echo "📊 健康检查: http://localhost/health"
echo "📝 Nginx日志: ./nginx/logs/"
echo ""
echo "API转发配置:"
echo "  /api/* -> localhost:1207/*"
echo "  /backend-api/* -> localhost:1202/*"
echo ""
echo "常用命令:"
echo "  查看服务状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f frontend"
echo "  停止服务: docker-compose down"
echo "  重新部署: ./deploy.sh"
echo ""

# 10. 显示Java服务提醒
echo "⚠️ 重要提醒:"
echo "请确保以下Java服务正在运行:"
echo "  - 端口 1207: 主要业务API服务"
echo "  - 端口 1202: 对话流/工作流API服务"
echo "否则前端API请求将失败"