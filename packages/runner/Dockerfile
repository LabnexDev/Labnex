# Use Playwright base image with necessary browsers
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy only runner package first for caching
COPY packages/runner ./packages/runner

# Install dependencies for runner
WORKDIR /app/packages/runner
RUN npm ci && npm run build && npm prune --omit=dev

# Final command
CMD ["node", "dist/cloudRunner.js"] 