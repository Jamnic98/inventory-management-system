# Explicitly set platform for Raspberry Pi ARM64 architecture
FROM node:22-slim AS build

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install packages clean inside the ARM64 container
RUN npm install

# Copy project files
COPY . .

# Run build
RUN npm run build

# --- Stage 2: Production Server ---
FROM nginx:alpine-slim AS production

# Copy custom Nginx SPA routing config to handle direct route reloads (e.g., /items)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]