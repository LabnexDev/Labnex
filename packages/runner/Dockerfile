# Use Playwright base image with necessary browsers
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy root package files first for better caching
COPY package*.json ./

# Copy workspace packages
COPY packages/cli ./packages/cli
COPY packages/runner ./packages/runner

# Install deps for all workspaces (prod-only)
RUN npm install --workspaces --include-workspace-root --omit=dev

# Build CLI first so its dist output is available
RUN npm run build -w @labnex/cli

# Build runner and prune dev deps
RUN npm run build -w @labnex/cloud-runner && npm prune --omit=dev -w @labnex/cloud-runner

# Set working directory to runner dist
WORKDIR /app/packages/runner

# Final command
CMD ["node", "dist/cloudRunner.js"] 