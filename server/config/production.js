module.exports = {
  // Server Configuration
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // Database Configuration
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL,
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'https://echolearn.vercel.app',
  
  // External API Keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Security Configuration
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  aiRateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Production specific settings
  secureCookies: true,
  sameSiteStrict: true,
  trustProxy: true,
  
  // CORS settings for production
  corsOrigins: [
    process.env.FRONTEND_URL || 'https://echolearn.vercel.app',
    /\.vercel\.app$/,
    /\.railway\.app$/
  ]
} 