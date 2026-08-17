# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./
COPY patches/ patches/

# Copy workspace package.json files
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install all dependencies (including devDependencies for build)
# --ignore-scripts to avoid postinstall issues with workspace bins
RUN npm ci --ignore-scripts && npx patch-package

# Copy source code
COPY apps/backend/ apps/backend/
COPY packages/shared/ packages/shared/

# Build shared package first (backend depends on it)
RUN npm run build -w @css/shared

# Generate Prisma client before TypeScript build
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build backend
RUN npm run build -w @css/backend

# ---- Stage 2: Production ----
FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/apps/backend/dist/ apps/backend/dist/
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy Prisma schema and generate client
COPY --from=builder /app/apps/backend/prisma/ apps/backend/prisma/
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Expose the port the app runs on
EXPOSE 4000

# Use dumb-init to handle PID 1 and signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Start the backend server
CMD ["node", "apps/backend/dist/index.js"]
