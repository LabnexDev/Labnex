## Dockerfile for Labnex Discord Bot (multi-stage)

# ---------- build stage ----------
FROM node:20 AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled JavaScript
COPY --from=build /app/dist ./dist

# Default command – start the bot
CMD [ "node", "dist/bots/labnexAI/labnexAI.bot.js" ] 