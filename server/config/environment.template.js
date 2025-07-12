// Environment Configuration Template
// Copy this file to .env in your project root and fill in the values

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/echolearn',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Frontend Configuration
  FRONTEND_URL: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',

  // External API Keys (Keep these secure - NEVER commit to version control)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Email Configuration (for password reset, email verification, etc.)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // Security Configuration
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/combined.log',
  ERROR_LOG_FILE: process.env.ERROR_LOG_FILE || 'logs/error.log'
}

/*
To use this configuration:

1. Create a .env file in your project root
2. Add the following variables:

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/echolearn
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
AI_RATE_LIMIT_MAX=10
LOG_LEVEL=info
LOG_FILE=logs/combined.log
ERROR_LOG_FILE=logs/error.log

3. IMPORTANT: Add .env to your .gitignore file to prevent committing sensitive information
*/ 