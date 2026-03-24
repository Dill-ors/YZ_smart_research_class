# 构建阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22-alpine3.22 AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 覆盖默认的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建好的静态资源
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
