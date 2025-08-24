# Chat App Production Deployment Guide

## Option 1: Render (Recommended - Free Tier Available)

### Backend Deployment on Render:

1. **Push your code to GitHub** (if not already done)
2. **Go to [render.com](https://render.com)** and sign up
3. **Create a new Web Service**
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Set Environment Variables in Render:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

### Frontend Deployment on Render:

1. **Create another Web Service for frontend**
   - Connect same GitHub repository
   - Select the `frontend` folder as root directory
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -l 3000`
   - Environment: `Node`

2. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
   ```

## Option 2: Vercel + Railway

### Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   REACT_APP_SOCKET_URL=https://your-backend.railway.app
   ```

### Backend on Railway:
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Set root directory to `backend`
4. Environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection
   JWT_SECRET=your_secret
   PORT=8080
   ```

## Option 3: Netlify + Heroku

### Frontend on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `frontend/build` folder after running `npm run build`
3. Or connect GitHub for automatic deployments

### Backend on Heroku:
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-chat-backend`
3. Set environment variables: `heroku config:set NODE_ENV=production`
4. Deploy: `git push heroku main`

## Database Setup (MongoDB Atlas - Free):

1. **Go to [mongodb.com/atlas](https://mongodb.com/atlas)**
2. **Create free cluster**
3. **Create database user**
4. **Whitelist IP addresses** (0.0.0.0/0 for production)
5. **Get connection string** and use in MONGODB_URI

## Pre-deployment Checklist:

- [ ] Update CORS origins in backend
- [ ] Set production API URLs in frontend
- [ ] Configure MongoDB Atlas
- [ ] Set all environment variables
- [ ] Test build commands locally
- [ ] Push code to GitHub

## Quick Commands:

### Test production build locally:
```bash
# Frontend
cd frontend
npm run build
npx serve -s build

# Backend  
cd backend
NODE_ENV=production npm start
```

### Environment Files to Create:

**backend/.env.production:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-super-secret-jwt-key
PORT=10000
CORS_ORIGIN=https://your-frontend-domain.com
```

**frontend/.env.production:**
```
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```