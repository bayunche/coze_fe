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

# 9. 获取服务器IP地址
echo ""
echo "=== 部署完成 ==="

# 获取服务器IP（优先显示非环回地址）
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "未获取到")

echo "📍 服务器访问地址:"
echo "  本地访问: http://localhost"
echo "  外部访问: http://$SERVER_IP"
echo "  健康检查: http://$SERVER_IP/health"
echo ""
echo "📝 Nginx日志: ./nginx/logs/"
echo ""
echo "🔗 API转发配置:"
echo "  /api/* -> localhost:1207/*"
echo "  /backend-api/* -> localhost:1202/*"
echo ""
echo "⚙️ 常用命令:"
echo "  查看服务状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f frontend"
echo "  停止服务: docker-compose down"
echo "  重新部署: ./deploy.sh"
echo ""

# 10. 检查Java服务状态
echo "⚠️ 检查Java服务状态:"
if curl -s http://localhost:1207/ &> /dev/null; then
    echo "✅ 端口 1207 (主要业务API) 服务正常"
else
    echo "❌ 端口 1207 (主要业务API) 无响应"
fi

if curl -s http://localhost:1202/ &> /dev/null; then
    echo "✅ 端口 1202 (对话流API) 服务正常"  
else
    echo "❌ 端口 1202 (对话流API) 无响应"
fi

echo ""
echo "💡 提示: 如果Java服务无响应，请先启动相应的后端服务"