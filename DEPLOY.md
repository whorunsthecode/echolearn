# EchoLearn Deployment Guide - Railway + Vercel

## Overview
This guide will help you deploy EchoLearn with:
- **Backend**: Railway (Express.js API)
- **Frontend**: Vercel (React/Vite app)
- **Database**: MongoDB Atlas (Free tier)

## Prerequisites
- GitHub account
- Railway account (free signup)
- Vercel account (free signup)
- MongoDB Atlas account (free signup)

## Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Create a new project called "EchoLearn"

### 1.2 Create a Free Cluster
1. Click "Create a New Cluster"
2. Choose "Shared" (free tier)
3. **Cloud Provider & Region Selection**:
   - **Provider**: Choose **AWS** (recommended)
   - **Region**: Choose closest to your users:
     - **US East (N. Virginia)** - Best for North America
     - **EU West (Ireland)** - Best for Europe
     - **AP Southeast (Singapore)** - Best for Asia-Pacific
   - **Cluster Tier**: M0 Sandbox (Free Forever)
4. Name your cluster "echolearn-cluster"
5. Click "Create Cluster"

> **Why AWS?** Railway and Vercel both have optimized AWS connectivity, resulting in faster database queries and better performance.

### 1.3 Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `echolearn-user`
5. Generate a secure password (save it!)
6. Set role to "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (it looks like: `mongodb+srv://echolearn-user:<password>@echolearn-cluster.xxxxx.mongodb.net/`)
5. Replace `<password>` with your actual password
6. Add `/echolearn` at the end: `mongodb+srv://echolearn-user:your-password@echolearn-cluster.xxxxx.mongodb.net/echolearn`

### 1.6 Performance Optimization
For optimal performance with your Railway + Vercel setup:
- **Database Name**: `echolearn`
- **Collections**: Will be auto-created by your app
- **Indexes**: MongoDB will auto-optimize for common queries

## Step 2: Deploy Backend to Railway

### 2.1 Push Code to GitHub
1. Create a new repository on GitHub called "echolearn"
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/echolearn.git
   git push -u origin main
   ```

### 2.2 Deploy to Railway
1. Go to [Railway](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your "echolearn" repository
6. Railway will automatically detect Node.js and deploy

### 2.3 Configure Environment Variables
1. In Railway dashboard, go to your project
2. Click on the "Variables" tab
3. Add these environment variables:

```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://echolearn-user:your-password@echolearn-cluster.xxxxx.mongodb.net/echolearn
JWT_SECRET=your-super-secure-jwt-secret-256-bits-long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app-name.vercel.app
GEMINI_API_KEY=AIzaSyBOhcDbnrpah3dzC7nDb7ZpdKaWV7VM_jg
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
AI_RATE_LIMIT_MAX=10
LOG_LEVEL=info
```

### 2.4 Generate JWT Secret
Run this command locally to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.5 Get Railway Backend URL
1. In Railway dashboard, go to your project
2. Click on "Settings"
3. Copy the "Public Domain" URL (e.g., `https://echolearn-backend-production.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your "echolearn" repository
5. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build:frontend`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 3.2 Configure Environment Variables
1. In Vercel dashboard, go to your project
2. Go to "Settings" > "Environment Variables"
3. Add this environment variable:

```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

Replace `your-railway-app.up.railway.app` with your actual Railway domain.

### 3.3 Update Railway Frontend URL
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

## Step 4: Update Frontend for Production

### 4.1 Update secureApiService.js
The frontend needs to use the production backend URL. Update the baseURL:

```javascript
// In src/services/secureApiService.js
this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
```

### 4.2 Update App.jsx Backend Check
Update the backend status check to use the production URL:

```javascript
// In src/App.jsx, update the checkBackendStatus function
const checkBackendStatus = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
    const response = await fetch(`${apiUrl.replace('/api', '')}/api/health`)
    if (response.ok) {
      setBackendStatus('connected')
    } else {
      setBackendStatus('disconnected')
    }
  } catch (error) {
    console.error('Backend connection error:', error)
    setBackendStatus('disconnected')
  }
}
```

## Step 5: Test Your Deployment

### 5.1 Test Backend
1. Visit your Railway URL + `/api/health`
2. Should return: `{"status":"OK","timestamp":"...","uptime":...}`

### 5.2 Test Frontend
1. Visit your Vercel URL
2. Check that "AI Status" shows "Secure Backend Connected"
3. Test the app functionality

## Step 6: Custom Domain (Optional)

### 6.1 Configure Custom Domain on Vercel
1. Go to Vercel dashboard > Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 6.2 Update Environment Variables
Update both Railway and Vercel to use your custom domain:
- Railway: `FRONTEND_URL=https://yourdomain.com`
- Vercel: Update any hardcoded URLs

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly
2. **MongoDB Connection**: Check your connection string and IP whitelist
3. **Environment Variables**: Ensure all required variables are set in both platforms
4. **Build Errors**: Check build logs in Railway/Vercel dashboards

### Debugging Steps

1. **Check Railway Logs**: Railway dashboard > Deployments > View logs
2. **Check Vercel Logs**: Vercel dashboard > Functions > View logs
3. **Test API Endpoints**: Use curl or Postman to test backend endpoints
4. **Check Network Tab**: Use browser dev tools to see API calls

## Security Checklist

- ✅ JWT secret is generated and secure
- ✅ MongoDB user has minimal required permissions
- ✅ API keys are not exposed in frontend
- ✅ CORS is configured correctly
- ✅ Rate limiting is enabled
- ✅ HTTPS is enforced

## Cost Breakdown (Free Tiers)

- **Railway**: $5/month credit (free tier)
- **Vercel**: Free tier (100GB bandwidth)
- **MongoDB Atlas**: Free tier (512MB storage)

**Total Cost**: $0/month (within free tier limits)

## Support

If you encounter issues:
1. Check the deployment logs first
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check CORS configuration

Your EchoLearn app should now be live and accessible worldwide! 🚀 