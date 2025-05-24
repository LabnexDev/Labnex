# 🚀 Deployment Checklist

## Pre-Deployment ✅

- [x] Frontend builds successfully (`npm run build`)
- [x] Backend builds successfully (`npm run build`)
- [x] Environment variables configured
- [x] GitHub Actions workflow configured
- [x] Render.yaml configured

## Post-Deployment Verification

### Backend (Render) ✅
- [ ] Backend deploys successfully to Render
- [ ] Health check endpoint works: `https://labnex-backend.onrender.com/api/health`
- [ ] Database connection established
- [ ] API endpoints respond correctly

### Frontend (GitHub Pages) ✅
- [ ] Frontend deploys to GitHub Pages
- [ ] Website loads: `https://labnexdev.github.io/Labnex`
- [ ] API calls reach backend correctly
- [ ] Authentication works
- [ ] All features functional

## Test Checklist 🧪

1. **Authentication**
   - [ ] Login works
   - [ ] Registration works
   - [ ] JWT tokens persist

2. **Core Features**
   - [ ] Project creation/management
   - [ ] Test case management
   - [ ] Task management
   - [ ] Bot integration

3. **UI/UX**
   - [ ] Dark theme renders correctly
   - [ ] Responsive design works
   - [ ] Navigation functions properly
   - [ ] Error handling displays properly

## Troubleshooting 🔧

### Common Issues:

1. **CORS Errors**
   - Verify `FRONTEND_URL` in backend environment
   - Check Render logs for CORS configuration

2. **API Connection Failed**
   - Verify API URL in frontend `.env.production`
   - Check network tab for 404/500 errors
   - Verify Render backend is running

3. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET is set in Render
   - Verify token persistence

### Useful Commands:

```bash
# Check frontend build
cd frontend && npm run build

# Check backend build  
cd backend && npm run build

# Local development
cd frontend && npm run dev
cd backend && npm run dev
```

### Monitoring:

- **Render Logs**: Dashboard → Service → Logs
- **GitHub Actions**: Repository → Actions tab
- **Browser Console**: F12 → Console tab for frontend errors

## URLs 🌐

- **Frontend**: https://labnexdev.github.io/Labnex
- **Backend**: https://labnex-backend.onrender.com
- **API Health**: https://labnex-backend.onrender.com/api/health

## Environment Variables Summary 📝

### Frontend (`.env.production`)
```
VITE_API_URL=https://labnex-backend.onrender.com/api
```

### Backend (Render - Auto-configured)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=(auto-generated)
JWT_SECRET=(auto-generated)  
FRONTEND_URL=https://labnexdev.github.io/Labnex
``` 