# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (cached unless package.json changes)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build-time env vars for Vite.
# In Docker Compose the frontend is served by nginx which proxies /api and
# /socket.io to the backend container, so we use RELATIVE paths ("/api") so
# the browser talks to the same origin and nginx handles routing.
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (handles SPA routing + API proxy to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
