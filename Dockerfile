FROM node:20-alpine

WORKDIR /app

# Установить зависимости
COPY package*.json ./
RUN npm ci --only=production

# Сгенерировать Prisma Client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Скопировать скомпилированный код
COPY dist/ ./dist/

# Установить uutils для healthcheck (опционально)
RUN apk add --no-cache curl

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
