# Stage 1: Build stage with Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock ./

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy application source
COPY . .

# Build the Angular SSR application
RUN bun run build

# Stage 2: Minimal runtime with Bun
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy built artifacts
COPY --from=builder /app/dist/ChallengeWebMCP ./dist/ChallengeWebMCP
COPY package.json ./

EXPOSE 4000

CMD ["bun", "dist/ChallengeWebMCP/server/server.mjs"]
