# EchoLearn Setup Guide

This guide will help you set up and run the secure EchoLearn application with all the implemented security measures.

## Prerequisites

- Node.js (version 16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git
- Google Gemini API Key (optional, falls back to demo data)

## Installation

1. **Clone and install dependencies:**
   ```bash
   cd EchoLearn
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root with the following variables:

   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/echolearn

   # JWT Configuration (IMPORTANT: Use a strong secret in production)
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-very-secure
   JWT_EXPIRES_IN=7d

   # Frontend Configuration
   FRONTEND_URL=http://localhost:5173

   # External API Keys (Get your key from: https://makersuite.google.com/app/apikey)
   GEMINI_API_KEY=your-actual-gemini-api-key-here

   # Security Configuration
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX=100
   AUTH_RATE_LIMIT_MAX=5
   AI_RATE_LIMIT_MAX=10

   # Logging Configuration
   LOG_LEVEL=info
   LOG_FILE=logs/combined.log
   ERROR_LOG_FILE=logs/error.log
   ```

3. **Get a Google Gemini API Key (Optional):**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API key"
   - Copy the key and add it to your `.env` file as `GEMINI_API_KEY`
   - **Note:** Without an API key, the app will use demo data for AI features

4. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in MONGODB_URI
   ```

## Running the Application

### Development Mode (Recommended)
```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Backend server on http://localhost:5001
- Frontend development server on http://localhost:5173

### Separate Backend and Frontend
```bash
# Terminal 1: Start backend only
npm run dev:backend

# Terminal 2: Start frontend only  
npm run dev:frontend
```

### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm start
```

## Verification

1. **Check backend health:**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Check frontend:**
   Visit http://localhost:5173 in your browser

3. **Check AI functionality:**
   - Upload a document or paste text
   - Click "Generate AI Summary" 
   - If you see "✅ Summary generated successfully via direct API" in console, AI is working
   - If you see "📋 Falling back to demo data", you need to set up the Gemini API key

4. **Check logs:**
   ```bash
   tail -f logs/combined.log
   ```

## Security Features Implemented ✅

### 1. Rate Limiting on Login Attempts
- **Protection:** Maximum 3 login attempts per 15 minutes per IP
- **Implementation:** Express rate limiting with progressive delays
- **User lockout:** Account locks for 2 hours after 5 failed attempts

### 2. Secured API Keys
- **Protection:** API keys stored securely in backend environment
- **Implementation:** All AI requests proxy through authenticated backend endpoints
- **No exposure:** Frontend never sees actual API keys

### 3. Admin Functions Protected by Backend Routes
- **Protection:** Role-based access control (RBAC) with JWT authentication
- **Implementation:** All admin routes require `admin` role verification
- **Prevention:** Admins cannot change their own roles or delete themselves

### 4. Database Manipulation Prevention
- **Protection:** No direct database access from frontend
- **Implementation:** All database operations through authenticated API endpoints
- **Security:** Input validation, sanitization, and parameterized queries

## User Roles

The system supports three user roles:
- **user**: Default role with basic access
- **teacher**: Enhanced access for educational content
- **admin**: Full system administration access

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### AI Services (No Authentication Required in Demo Mode)
- `POST /api/ai/generate-summary` - Generate content summary
- `POST /api/ai/generate-questions` - Generate quiz questions
- `GET /api/ai/debug-status` - Check API key status

### Admin (Admin Role Required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get specific user
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/status` - Activate/deactivate user
- `GET /api/admin/stats` - System statistics

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/echolearn` |
| `JWT_SECRET` | JWT signing secret (MUST be secure) | `your-256-bit-secret` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | `your-api-key` |

## Troubleshooting

### AI Features Not Working
If you're seeing demo data instead of real AI responses:
1. **Check API Key:** Ensure `GEMINI_API_KEY` is set in your `.env` file
2. **Get API Key:** Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get a free key
3. **Check Console:** Look for API error messages in browser developer tools
4. **Verify Backend:** Check `curl http://localhost:5001/api/ai/debug-status`

### Port Already in Use
If port 5001 is in use, change the `PORT` in your `.env` file and update the frontend:
1. Change `PORT=5001` to `PORT=5002` in `.env`
2. Update `baseURL` in `src/services/secureApiService.js`

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `MONGODB_URI`
- For MongoDB Atlas, ensure IP whitelist includes your IP

### JWT Secret Warnings
For production, generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use different secrets for development and production
   - Rotate secrets regularly

2. **Database Security:**
   - Use MongoDB authentication in production
   - Enable MongoDB encryption at rest
   - Regular database backups

3. **Network Security:**
   - Use HTTPS in production
   - Configure firewall rules
   - Use reverse proxy (nginx/Apache) in production

4. **Monitoring:**
   - Monitor logs for suspicious activity
   - Set up alerts for failed login attempts
   - Regular security audits

## Production Deployment

For production deployment:

1. **Environment Setup:**
   - Set `NODE_ENV=production`
   - Use strong, unique `JWT_SECRET`
   - Configure proper `MONGODB_URI`
   - Set production `FRONTEND_URL`
   - Add your `GEMINI_API_KEY`

2. **Security Headers:**
   - The app includes Helmet.js for security headers
   - CORS is configured for production domains
   - Rate limiting is enforced

3. **SSL/TLS:**
   - Use HTTPS in production
   - Configure SSL certificates
   - Enable HSTS headers

## Demo Mode

EchoLearn includes comprehensive demo data that works without any API keys:
- **OCR Text Extraction:** Works with Tesseract.js (no API required)
- **AI Summary Generation:** Falls back to educational demo summaries
- **Quiz Generation:** Uses pre-built educational quiz questions
- **Text-to-Speech:** Uses browser's built-in Web Speech API

This ensures the application is fully functional even without external API keys!

## Support

- Check the `SECURITY.md` file for detailed security information
- Review logs in the `logs/` directory
- Check MongoDB connection and API key configuration
- For Gemini API issues, visit [Google AI Studio](https://makersuite.google.com/app/apikey)

## License

This project includes comprehensive security measures following industry best practices and OWASP guidelines. 