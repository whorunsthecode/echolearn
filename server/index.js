const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const winston = require('winston')
require('dotenv').config()

// Import routes
const authRoutes = require('./routes/auth')
const aiRoutes = require('./routes/ai')
const adminRoutes = require('./routes/admin')
const { authenticateToken, requireRole } = require('./middleware/auth')

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'echolearn-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "blob:", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      workerSrc: ["'self'", "blob:", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      childSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:"]
    }
  }
}))

// Rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    })
  }
})

// Slow down for AI endpoints to prevent abuse
const aiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per window without delay
  delayMs: () => 1000, // add 1 second delay per request after delayAfter
  maxDelayMs: 30000, // max delay of 30 seconds
  validate: { delayMs: false } // disable deprecation warning
})

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key])
      }
    })
  }
  next()
})

// Prevent parameter pollution
app.use(hpp())

// Apply rate limiting
app.use(generalLimiter)

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echolearn')
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)

// AI routes with optional authentication (demo mode)
app.use('/api/ai', aiSlowDown, (req, res, next) => {
  // Try to authenticate, but don't require it for demo purposes
  if (req.headers.authorization) {
    authenticateToken(req, res, next)
  } else {
    // Demo mode - allow unauthenticated access with limited features
    req.user = null
    next()
  }
}, aiRoutes)

app.use('/api/admin', authenticateToken, requireRole('admin'), adminRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  mongoose.connection.close().then(() => {
    logger.info('MongoDB connection closed')
    process.exit(0)
  }).catch(err => {
    logger.error('Error closing MongoDB connection:', err)
    process.exit(1)
  })
})

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

module.exports = app 