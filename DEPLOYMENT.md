# EchoLearn Deployment Guide

This guide covers deploying EchoLearn to various platforms. The application is a full-stack app with a React frontend and Node.js backend.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended
- **Frontend**: Deploy to Vercel (free tier available)
- **Backend**: Deploy to Railway (PostgreSQL + Node.js hosting)
- **Database**: Railway PostgreSQL or MongoDB Atlas

### Option 2: Single Platform Deployment
- **Railway**: Full-stack deployment (both frontend and backend)
- **Render**: Full-stack deployment with PostgreSQL
- **Heroku**: Full-stack deployment (requires paid plan)

### Option 3: Serverless
- **Vercel**: Frontend + Serverless functions for backend
- **Netlify**: Frontend + Netlify functions for backend

---

## 🔧 Pre-Deployment Setup

### 1. Environment Variables Required

```env
# Backend Environment Variables
PORT=5001
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.vercel.app
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# Security Configuration
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
AI_RATE_LIMIT_MAX=10
LOG_LEVEL=info
```

### 2. Get Required API Keys

**Google Gemini API Key (Optional but Recommended):**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API key"
4. Copy the key for `GEMINI_API_KEY`

**Note**: Without Gemini API key, the app uses demo data for AI features.

---

## 📦 Platform-Specific Deployment

### 🌐 Vercel + Railway (Recommended)

#### Deploy Backend to Railway

1. **Create Railway Account**: Visit [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   ```bash
   # Railway will automatically detect the project type
   # The railway.toml file is already configured
   ```

3. **Set Environment Variables in Railway Dashboard**:
   - `NODE_ENV=production`
   - `MONGODB_URI=your-mongodb-url`
   - `JWT_SECRET=your-secure-secret`
   - `GEMINI_API_KEY=your-api-key`
   - `FRONTEND_URL=https://your-app.vercel.app`

4. **Note the Railway URL**: Something like `https://your-app.railway.app`

#### Deploy Frontend to Vercel

1. **Create Vercel Account**: Visit [vercel.com](https://vercel.com)

2. **Deploy from GitHub**:
   ```bash
   # Vercel will auto-detect React/Vite project
   # The vercel.json file is already configured
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - `VITE_API_URL=https://your-backend.railway.app/api`

4. **Build Settings**:
   - Build Command: `npm run build:frontend`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 🚂 Railway (Full-Stack)

1. **Create New Project** on Railway
2. **Connect GitHub Repository**
3. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection
   JWT_SECRET=your-secure-secret
   GEMINI_API_KEY=your-api-key
   FRONTEND_URL=https://your-app.railway.app
   ```
4. **Railway Configuration**: The `railway.toml` file is already set up
5. **Deploy**: Railway will automatically build and deploy

### 🎨 Render (Full-Stack)

1. **Create Render Account**: Visit [render.com](https://render.com)
2. **Create Web Service** from GitHub
3. **Configuration**:
   - Environment: `Node`
   - Build Command: `npm install && npm run build:frontend`
   - Start Command: `npm start`
4. **Set Environment Variables** in Render dashboard
5. **Add PostgreSQL Database** (optional, or use MongoDB Atlas)

### 🟣 Heroku (Full-Stack)

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-url
heroku config:set JWT_SECRET=your-secure-secret
heroku config:set GEMINI_API_KEY=your-api-key

# Deploy
git push heroku main
```

---

## 💾 Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**: Visit [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Choose free tier
3. **Database Access**: Create database user
4. **Network Access**: Add your deployment platform IPs (or 0.0.0.0/0 for development)
5. **Get Connection String**: Use in `MONGODB_URI`

### Railway PostgreSQL

```bash
# Railway automatically provisions PostgreSQL
# Connection string available in Railway dashboard
# Update server code to use PostgreSQL instead of MongoDB if preferred
```

---

## 🔐 Security Checklist

- [ ] **Strong JWT Secret**: Use 256-bit secret for production
- [ ] **Environment Variables**: Never commit secrets to git
- [ ] **HTTPS**: Ensure all deployed URLs use HTTPS
- [ ] **CORS**: Configure proper CORS origins in production
- [ ] **Rate Limiting**: Verify rate limiting is active
- [ ] **Database Security**: Use authentication and encryption
- [ ] **API Keys**: Secure storage and rotation plan

---

## 🧪 Testing Deployment

### Backend Health Check
```bash
curl https://your-backend-url/api/health
# Should return: {"status":"OK","timestamp":"...","uptime":...}
```

### Frontend Verification
1. Visit your deployed frontend URL
2. Test file upload and OCR functionality
3. Test AI summary generation
4. Check browser console for errors
5. Test responsive design on mobile

### API Integration Test
```bash
# Test AI functionality
curl -X POST https://your-backend-url/api/ai/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Test content for AI processing"}'
```

---

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility (requires v16+)
- Verify all dependencies are installed
- Check for syntax errors in code

**Environment Variables:**
- Ensure all required variables are set
- Check variable names match exactly
- Verify secrets are properly encoded

**CORS Errors:**
- Update `FRONTEND_URL` in backend environment
- Check CORS configuration in `server/index.js`
- Verify all URLs use HTTPS in production

**Database Connection:**
- Test MongoDB connection string locally first
- Check network access settings in MongoDB Atlas
- Verify database user permissions

**AI Features Not Working:**
- Check if `GEMINI_API_KEY` is set
- Verify API key is valid and has quota
- Check logs for API error messages
- Confirm fallback to demo data is working

### Logs and Debugging

**Railway:**
```bash
# View logs in Railway dashboard
# Or use Railway CLI: railway logs
```

**Vercel:**
```bash
# View function logs in Vercel dashboard
# Check runtime logs for serverless functions
```

**Render:**
```bash
# View logs in Render dashboard
# Check build logs and runtime logs separately
```

---

## 🔄 CI/CD Setup

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy EchoLearn
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build:frontend
      - run: npm test # if you have tests
      
      # Deploy steps for your chosen platform
```

---

## 📈 Performance Optimization

### Production Optimizations Applied

- [x] **Frontend**: Vite production build with code splitting
- [x] **Backend**: Compression and caching headers
- [x] **Security**: Helmet.js for security headers
- [x] **Rate Limiting**: Express rate limiting implemented
- [x] **Error Handling**: Comprehensive error boundaries
- [x] **Logging**: Winston logging for production monitoring

### Monitoring Recommendations

- **Uptime Monitoring**: Use UptimeRobot or similar
- **Error Tracking**: Consider Sentry for error monitoring
- **Performance**: Monitor Core Web Vitals
- **Analytics**: Optional Google Analytics integration

---

## 📞 Support

### If You Need Help

1. **Check Logs**: Review platform-specific logs first
2. **Environment Variables**: Verify all required variables are set
3. **API Keys**: Ensure Gemini API key is valid
4. **Documentation**: Review the SETUP.md file
5. **GitHub Issues**: Create issue with error details

### Useful Commands

```bash
# Local testing
npm run dev

# Production build test
npm run build:frontend
npm start

# Check API status
curl http://localhost:5001/api/ai/debug-status
```

---

## 🎉 Success!

Once deployed, your EchoLearn application will be live with:
- ✅ **Full OCR functionality** using Tesseract.js
- ✅ **AI-powered summaries and quizzes** (with Gemini API)
- ✅ **Dyslexia-friendly design** with accessibility features
- ✅ **Mobile responsive interface**
- ✅ **Secure authentication** and data protection
- ✅ **Production-ready performance**

**Demo Features**: Even without API keys, the app provides comprehensive demo data for all features!

---

*Need help? Check the troubleshooting section or create a GitHub issue with your deployment platform and error details.* 