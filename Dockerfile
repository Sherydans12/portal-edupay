FROM node:20-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Keep production dependencies plus Prisma CLI for runtime migrations
FROM deps AS prod-deps
RUN npm prune --omit=dev \
  && npm install --no-save --no-audit --no-fund prisma@6.19.3

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image, copy the standalone server and runtime dependencies
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Ensure the generated Prisma client and engine binaries survive standalone tracing.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node server.js"]
