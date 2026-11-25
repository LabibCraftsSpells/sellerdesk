# ============================================================
# SellerDesk Production Dockerfile
# Multi-stage build: compiles Vite frontend and runs Express backend
# ============================================================

# Stage 1: Build client frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client manifests
COPY ["React Vite Web/package.json", "React Vite Web/package-lock.json*", "./"]
RUN npm ci

# Copy client source code and build
COPY ["React Vite Web/", "./"]
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install build tools for native compilation if needed
RUN apk add --no-cache python3 make g++ wget

ENV NODE_ENV=production
ENV PORT=5001

# Copy root & server manifests
COPY ["package.json", "package-lock.json*", "./"]
COPY ["Node Express API/package.json", "Node Express API/package-lock.json*", "./Node Express API/"]
COPY ["React Vite Web/package.json", "React Vite Web/package-lock.json*", "./React Vite Web/"]
RUN ln -s "Node Express API" server

# Install production dependencies
RUN npm ci --omit=dev

# Copy server code, database schemas, and migration scripts
COPY ["Node Express API/", "./Node Express API/"]
COPY database/ ./database/
COPY scripts/ ./scripts/

# Copy compiled frontend assets from client-builder
COPY --from=client-builder /app/client/dist ./dist
RUN mkdir -p "React Vite Web" client && \
    ln -s /app/dist "React Vite Web/dist" && \
    ln -s /app/dist client/dist

# Create storage directories
RUN mkdir -p /app/database /app/uploads

EXPOSE 5001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

CMD ["node", "scripts/start-production.js"]
