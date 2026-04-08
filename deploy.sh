#!/bin/bash

# 智能教研系统部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署智能教研系统..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
    echo "💡 建议: 复制 .env.example 为 .env 并修改配置"
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=$JWT_SECRET" > .env
    echo "✅ 已自动生成 JWT_SECRET"
else
    echo "✅ 已加载 .env 配置文件"
fi

# 停止旧容器（如果存在）
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || true

# 清理旧镜像（可选）
read -p "是否清理旧镜像以重新构建? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker-compose rm -f
    docker rmi yz_smart_research_class_smart-research 2>/dev/null || true
fi

# 构建并启动容器
echo "🔨 构建并启动容器..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查健康状态
echo "🏥 检查服务健康状态..."
if docker-compose ps | grep -q "healthy"; then
    echo "✅ 服务运行正常!"
else
    echo "⚠️  服务可能还在启动中，请稍后检查"
fi

# 显示容器状态
echo ""
echo "📊 容器状态:"
docker-compose ps

echo ""
echo "🎉 部署完成!"
echo "📱 访问地址: http://localhost 或 http://$(hostname -I | awk '{print $1}')"
echo "📋 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
