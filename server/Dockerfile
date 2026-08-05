# --------------------------------------
# Build Stage
# --------------------------------------
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client BEFORE compiling TypeScript
RUN npx prisma generate
RUN npm run build

# --------------------------------------
# Production Stage
# --------------------------------------
FROM node:24-slim AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema and regenerate client engine files for production
COPY prisma.config.ts ./
COPY prisma ./prisma

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate

# Copy compiled TS output and generated client if located outside node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated

EXPOSE 8080
CMD ["node", "dist/index.js"]
