# ==============================================================================
# Security-Hardened Dockerfile for Express POS API
# ==============================================================================
FROM node:20-alpine AS base

# Install security updates and dumb-init
RUN apk --no-cache add dumb-init

WORKDIR /usr/src/app

# Dependencies stage
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Application stage
COPY . .

# Run with least-privilege non-root user
USER node

EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
