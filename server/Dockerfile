FROM node:20-alpine

# Install dumb-init for proper signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Install dependencies first (cached layer unless package.json changes)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production
# PORT is intentionally NOT hardcoded here so it can be overridden
# by docker-compose environment or Render's injected PORT variable

# Use dumb-init so Node receives OS signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
