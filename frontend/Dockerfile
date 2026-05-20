# =========================
# Stage 1: Build React/Vite
# =========================
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build production
RUN npm run build


FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Xóa file mặc định nginx
RUN rm -rf ./*

# Copy build từ stage builder
COPY --from=builder /app/dist .

# Copy nginx config custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]