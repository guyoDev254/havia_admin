# -------- Base --------
FROM node:20-alpine AS base
WORKDIR /app
# Install Yarn 1.x (classic) to match yarn.lock v1 format
RUN apk add --no-cache yarn

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# -------- Build --------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create public directory if it doesn't exist (Next.js requires it)
RUN mkdir -p public

# Build the application
RUN yarn build

# -------- Runtime --------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build
# Copy standalone build (includes server.js and necessary files)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory (created in builder stage if it didn't exist)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
    