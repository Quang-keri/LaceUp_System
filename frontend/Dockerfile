FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Run with Nginx ---
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Xóa file mặc định của Nginx
RUN rm -rf ./*

# Copy folder đã build từ Stage 1 sang Nginx
# LƯU Ý: Nếu project bạn dùng Vite, hãy sửa '/app/build' thành '/app/dist'
COPY --from=builder /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]