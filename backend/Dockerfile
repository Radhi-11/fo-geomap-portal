FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN chown -R node:node /app
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
