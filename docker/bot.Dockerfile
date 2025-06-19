## Dockerfile for Labnex Discord Bot (multi-stage)

# ---------- build stage ----------
FROM node:20 AS build
WORKDIR /app

# Copy backend package files only
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy backend source
COPY . ./

# Compile TypeScript (backend includes the bot code)
RUN npm run build --prefix .

# ---------- runtime stage ----------
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist

CMD [ "node", "dist/bots/labnexAI/labnexAI.bot.js" ] 