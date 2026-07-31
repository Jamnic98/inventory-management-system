# --------------------------------------
# Build Stage
# --------------------------------------
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --------------------------------------
# Production Stage
# --------------------------------------
FROM node:24-slim AS production
WORKDIR /app

COPY package*.json ./
# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled TS output from build stage
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/index.js"]