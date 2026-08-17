# --------------------------------------
# Build Stage
# --------------------------------------
FROM node:24-slim AS build
WORKDIR /app

# Install openssl for Prisma build step
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Prune devDependencies to keep image size small
RUN npm prune --omit=dev

# --------------------------------------
# Production Stage
# --------------------------------------
FROM node:24-slim AS production
WORKDIR /app

# Install OpenSSL required by Prisma engine at runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Copy pre-pruned node_modules, compiled code, and Prisma schema from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# Copy custom generated client directory if configured in schema.prisma
COPY --from=build /app/src/generated ./src/generated

# Setup entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]