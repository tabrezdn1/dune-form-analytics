# Multi-stage Dockerfile for Next.js
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

COPY apps/web/ .
COPY packages/ ../packages/

# Build the application
RUN npm run build

# Development stage
FROM base AS development
WORKDIR /app

# Install all dependencies for development
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm install

# Copy source code
COPY apps/web/ .
COPY packages/ ../packages/

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production image, copy all the files and run next
FROM base AS production
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder from the project as this is not included in build process
COPY apps/web/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
