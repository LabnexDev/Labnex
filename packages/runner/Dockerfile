# Use Playwright base image with necessary browsers
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# Copy runner and executor packages for caching
COPY packages/runner ./packages/runner
COPY packages/executor ./packages/executor

# Set working directory to runner package
WORKDIR /app/packages/runner

# Install production dependencies, build, and prune dev deps
RUN npm install --omit=dev && npm run build && npm prune --omit=dev

# Final command
CMD ["node", "dist/cloudRunner.js"] 