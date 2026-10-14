FROM node:24-bookworm-slim

# Prisma cần openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production

# Áp dụng migration rồi chạy app; "exec" để node nhận được tín hiệu SIGTERM
CMD ["sh", "-c", "npx prisma migrate deploy && exec node src/server.js"]
