# Labnex Deployment Guide 🚀

This guide covers deploying Labnex to production using GitHub Pages for the frontend and Render for the backend.

## 🏗️ Architecture Overview

- **Frontend**: React app deployed to GitHub Pages with GitHub Actions CI/CD
- **Backend**: Node.js API deployed to Render with automatic deployments
- **Database**: MongoDB Atlas cloud database
- **Services**: Discord bot deployed alongside the main API

## 📋 Prerequisites

Before deployment, ensure you have:

1. **GitHub Repository** with admin access: [https://github.com/LabnexDev/Labnex](https://github.com/LabnexDev/Labnex)
2. **Render Account** (free tier available)
3. **MongoDB Atlas Account** with cluster set up
4. **OpenAI API Key** for AI features
5. **Discord Bot Tokens** (optional, for Discord integration)

## 🚀 Frontend Deployment (GitHub Pages)

### 1. Repository Setup

The frontend is already configured for GitHub Pages deployment:

- ✅ **Vite Config**: `base: '/Labnex/'` configured
- ✅ **GitHub Actions**: Workflow file at `.github/workflows/deploy.yml`
- ✅ **Build Script**: `npm run build` produces optimized build
- ✅ **API Configuration**: Production API URL configured

### 2. Environment Variables

Your `.env` file in the frontend directory should include:

```bash
# Development API URL
VITE_API_URL=http://localhost:5000

# Production API URL (Render backend)
VITE_PRODUCTION_API_URL=https://labnex-backend.onrender.com
```

### 3. Enable GitHub Pages

1. Go to your [repository settings](https://github.com/LabnexDev/Labnex/settings/pages)
2. Navigate to **Pages** section
3. Set source to **Deploy from a branch**
4. Select **gh-pages** branch
5. Keep folder as **/ (root)**

### 4. Automatic Deployment

The GitHub Actions workflow automatically:
- Triggers on pushes to `main` branch
- Installs dependencies with `npm ci`
- Builds the React app with `npm run build`
- Deploys to `gh-pages` branch
- Makes the site available at `https://labnexdev.github.io/Labnex`

## ⚙️ Backend Deployment (Render)

### 1. Render Service Setup

#### Option A: Using render.yaml (Recommended)

The project includes a `render.yaml` file for one-click deployment:

1. **Connect Repository**: Link your GitHub repo to Render
2. **Auto-Deploy**: Render will use the `render.yaml` configuration
3. **Environment Variables**: Set up required environment variables

#### Option B: Manual Setup

1. **Create Web Service**:
   - Runtime: Node
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Health Check Path: `/api/health`

### 2. Environment Variables

Set these environment variables in Render dashboard:

```bash
# Required
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/labnex
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=https://labnexdev.github.io/Labnex

# Optional (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Optional (for Discord integration)
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

### 3. Database Setup

#### MongoDB Atlas Configuration

1. **Create Cluster**: Set up a free MongoDB Atlas cluster
2. **Database User**: Create a database user with read/write permissions
3. **Network Access**: Add `0.0.0.0/0` to IP whitelist (or Render's IP ranges)
4. **Connection String**: Get the connection string and add to `MONGODB_URI`

Example connection string:
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/labnex?retryWrites=true&w=majority
```

## 🔧 Configuration Updates

### Frontend API Configuration

The frontend automatically detects the environment and uses the correct API URL:

- **Development**: `http://localhost:5000` (with Vite proxy)
- **Production**: `https://your-render-app.onrender.com` (direct connection)

### CORS Configuration

Ensure your backend CORS is configured for the GitHub Pages domain:

```javascript
// backend/src/server.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://labnexdev.github.io'
  ],
  credentials: true
}));
```

## 🔍 Testing Deployment

### 1. Local Testing

Test the production build locally:

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

### 2. Deployment Verification

After deployment, verify:

- ✅ **Frontend**: Accessible at `https://labnexdev.github.io/Labnex`
- ✅ **Backend**: Health check at `/api/health` returns 200
- ✅ **Database**: MongoDB Atlas connection working
- ✅ **API Calls**: Frontend can communicate with backend
- ✅ **Authentication**: Login/register functionality works

### 3. Health Checks

Monitor deployment health:

```bash
# Check backend health
curl https://your-render-app.onrender.com/api/health

# Check frontend
curl https://labnexdev.github.io/Labnex
```

## 🚨 Common Issues & Solutions

### Frontend Issues

**Issue**: GitHub Pages shows 404 for client-side routes
**Solution**: The `404.html` file is already configured to handle this

**Issue**: API calls fail in production
**Solution**: Check CORS configuration and API URL in environment variables

### Backend Issues

**Issue**: Render build fails
**Solution**: Ensure `backend/package.json` has correct build script

**Issue**: Database connection fails
**Solution**: Verify MongoDB Atlas connection string and IP whitelist

**Issue**: Health check fails
**Solution**: Ensure `/api/health` endpoint is accessible

## 📊 Monitoring & Maintenance

### GitHub Actions

Monitor frontend deployments:
- **Actions Tab**: View build and deployment status at [https://github.com/LabnexDev/Labnex/actions](https://github.com/LabnexDev/Labnex/actions)
- **Logs**: Debug build failures
- **History**: Track deployment history

### Render Dashboard

Monitor your backend service:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and response time metrics
- **Deployments**: Deployment history and status

### MongoDB Atlas

Monitor database performance:
- **Metrics**: Database performance and usage
- **Alerts**: Set up alerts for high usage
- **Backups**: Automated backups enabled

## 🔄 Update Process

### Frontend Updates

1. **Push to Main**: Changes automatically deploy via GitHub Actions
2. **Monitor**: Check Actions tab for deployment status
3. **Verify**: Test the updated site at `https://labnexdev.github.io/Labnex`

### Backend Updates

1. **Push to Main**: Render automatically redeploys
2. **Monitor**: Check Render dashboard for deployment status
3. **Verify**: Test API endpoints and health check

## 🎯 Production Optimization

### Performance

- ✅ **Frontend**: Vite production builds with code splitting
- ✅ **Backend**: Node.js clustering for better performance
- ✅ **Database**: MongoDB Atlas optimized queries and indexing
- ✅ **CDN**: GitHub Pages includes global CDN

### Security

- ✅ **HTTPS**: Both platforms provide SSL/TLS encryption
- ✅ **Environment Variables**: Sensitive data stored securely
- ✅ **CORS**: Properly configured cross-origin requests
- ✅ **JWT**: Secure token-based authentication

---

## 🎉 Deployment Complete!

Your Labnex application will be running in production at:

- **Frontend**: `https://labnexdev.github.io/Labnex`
- **Backend**: `https://your-render-app.onrender.com`
- **Database**: MongoDB Atlas cloud cluster

**Next Steps**:
1. Push your changes to trigger the first deployment
2. Set up Render service using the `render.yaml` configuration
3. Configure environment variables in Render
4. Set up MongoDB Atlas and get your connection string
5. Monitor the deployments and verify everything works

🚀 **Welcome to production!** Your AI-powered testing automation platform is ready to launch! 