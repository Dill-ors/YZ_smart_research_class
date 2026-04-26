# 1. 前端构建阶段
FROM node:22-alpine AS build-frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --registry=https://registry.npmmirror.com
COPY . .
RUN npm run build

# 1.5 后端依赖构建阶段 (mysql2 无需原生模块编译)
FROM node:22-alpine AS build-backend
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production --registry=https://registry.npmmirror.com

# 2. 运行阶段 (Nginx 代理静态资源 + Node.js 后端服务)
FROM nginx:alpine

# 替换 Alpine 系统的软件源为清华大学镜像源 (TUNA)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装 Node.js 运行环境
RUN apk add --no-cache nodejs npm

# 覆盖默认的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制前端构建出的静态资源到 Nginx 目录
COPY --from=build-frontend /app/dist /usr/share/nginx/html/smart_research

# 设置后端工作目录
WORKDIR /app/server
# 复制后端源码文件 (包含 server.js 等)
COPY server/ ./
# 复制已编译好的后端 node_modules
COPY --from=build-backend /app/server/node_modules ./node_modules

# 暴露 80 端口供外部访问前端和代理接口
EXPOSE 80

# 启动命令:
# 1. 后台运行 Node.js 接口服务 (端口 3000)
# 2. 循环等待 Node 服务健康检查通过
# 3. 前台运行 Nginx 服务拦截请求 (端口 80)
CMD ["sh", "-c", "node server.js & \
  for i in $(seq 1 30); do \
    if wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1; then \
      echo 'Backend is ready, starting nginx...'; \
      nginx -g 'daemon off;'; \
    fi; \
    sleep 1; \
  done; \
  echo 'Backend health check failed, starting nginx anyway...'; \
  nginx -g 'daemon off;'"]
