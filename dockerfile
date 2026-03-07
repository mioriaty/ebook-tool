# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Install dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Limit Node heap to avoid OOM on low-RAM VPS
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NODE_ENV=production
RUN pnpm build

# ---- Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8386

RUN addgroup -g 1001 nodejs && adduser -S nextjs -u 1001

# Copy only what is needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Session data lives here – mount a volume so uploads survive container restarts
RUN mkdir -p /app/tmp/ebook-sessions && chown -R nextjs:nodejs /app/tmp

USER nextjs

EXPOSE 8386

CMD ["node_modules/.bin/next", "start", "--port", "8386"]
