# Stage 1: Build stage with Node 22 (required for Angular ESM route extraction hooks)
FROM node:22-alpine AS builder

WORKDIR /app

# Install Bun for fast package installation
RUN npm install -g bun

# Copy dependency manifests
COPY package.json bun.lock ./

# Install dependencies fast with Bun
RUN bun install --frozen-lockfile

# Copy application source
COPY . .

# Build the Angular SSR application (Node executes ESM loader hooks)
RUN bun run build

# Stage 2: Minimal production runtime with Bun
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy built SSR artifacts
COPY --from=builder /app/dist/ChallengeWebMCP ./dist/ChallengeWebMCP
COPY package.json ./

EXPOSE 4000

CMD ["bun", "dist/ChallengeWebMCP/server/server.mjs"]
