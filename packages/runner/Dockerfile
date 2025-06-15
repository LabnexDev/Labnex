# Use Playwright base image with necessary browsers
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy root package files first for better caching
COPY package*.json ./

# Copy workspace packages
COPY packages/executor ./packages/executor
COPY packages/cli ./packages/cli
COPY packages/runner ./packages/runner

# Install deps for all workspaces (prod-only)
RUN npm install --workspaces --include-workspace-root

# Build executor first
RUN npm run build -w @labnex/executor

# Build CLI
RUN npm run build -w @labnex/cli

# Build runner
RUN npm run build -w @labnex/cloud-runner

# Remove dev dependencies afterwards to slim image
RUN npm prune --omit=dev --workspaces --include-workspace-root

# Set working directory to runner dist
WORKDIR /app/packages/runner

# Final command
CMD ["node", "dist/cloudRunner.js"] 