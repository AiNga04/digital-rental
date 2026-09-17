# ==========================================
# Bước 1: Môi trường cài đặt thư viện (Dependencies)
# ==========================================
FROM node:20-alpine AS deps

# Cài đặt pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Copy các file khai báo thư viện và cấu hình pnpm vào
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Tải thư viện (dùng frozen-lockfile để cài đúng version như khi dev, không bị lệch)
RUN pnpm install --frozen-lockfile

# ==========================================
# Bước 2: Môi trường Build mã nguồn Next.js
# ==========================================
FROM node:20-alpine AS builder

# Bật pnpm lại cho môi trường này
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Copy thư viện (node_modules) đã cài ở Bước 1 sang đây
COPY --from=deps /app/node_modules ./node_modules

# Copy toàn bộ code frontend của bạn vào
COPY . .

# Khai báo các biến ARG để nhận giá trị từ GitHub Actions
ARG NEXT_PUBLIC_E2EE_ENABLED
ARG NEXT_PUBLIC_SERVER_JWK_X
ARG NEXT_PUBLIC_SERVER_JWK_Y
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI

# Đẩy ARG sang ENV để Next.js nướng vào JS Bundle
ENV NEXT_PUBLIC_E2EE_ENABLED=$NEXT_PUBLIC_E2EE_ENABLED
ENV NEXT_PUBLIC_SERVER_JWK_X=$NEXT_PUBLIC_SERVER_JWK_X
ENV NEXT_PUBLIC_SERVER_JWK_Y=$NEXT_PUBLIC_SERVER_JWK_Y
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI

# Tắt gửi dữ liệu phân tích về máy chủ Vercel (giúp build nhanh hơn)
ENV NEXT_TELEMETRY_DISABLED=1

# Bắt đầu quá trình build Next.js ra code production
RUN pnpm run build

# ==========================================
# Bước 3: Môi trường Chạy (Production)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Đặt biến môi trường báo hiệu đây là production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bảo mật: tạo user không có quyền root (quyền cao nhất) để chạy app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy thư mục public (chứa hình ảnh, favicon...)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy code đã được build ở chế độ standalone (siêu nhẹ, được tự sinh bởi Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy các file tĩnh CSS, JS (.next/static)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Yêu cầu container chạy bằng user 'nextjs'
USER nextjs

# Mở cổng 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Khi container khởi động sẽ chạy file server.js này (chỉ có khi build standalone)
CMD ["node", "server.js"]
