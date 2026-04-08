# 1. 前端构建阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22-alpine AS build-frontend
WORKDIR /app
# 复制依赖配置并安装（使用国内镜像加速构建）
COPY package.json package-lock.json* ./
RUN npm install --registry=https://registry.npmmirror.com
# 复制所有前端源码并进行打包
COPY . .
RUN npm run build

# 2. 运行阶段 (Nginx 代理静态资源 + Node.js 后端服务)
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:alpine

# 替换 Alpine 系统的软件源为清华大学镜像源 (TUNA)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装 Node.js 和 npm 运行环境，以及 sqlite 库
RUN apk add --no-cache nodejs npm sqlite

# 覆盖默认的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制前端构建出的静态资源到 Nginx 目录
COPY --from=build-frontend /app/dist /usr/share/nginx/html/smart_research

# 设置后端工作目录
WORKDIR /app/server
# 复制后端依赖配置并仅安装生产环境依赖（使用国内镜像加速）
COPY server/package.json server/package-lock.json* ./
RUN npm install --production --registry=https://registry.npmmirror.com

# 复制后端源码文件 (包含 server.js 等)
COPY server/ ./

# 暴露 80 端口供外部访问前端和代理接口
EXPOSE 80

# 启动命令: 
# 1. 后台运行 Node.js 接口服务 (端口 3000)
# 2. 前台运行 Nginx 服务拦截请求 (端口 80)
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]