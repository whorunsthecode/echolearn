const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const rateLimit = require('express-rate-limit')
const winston = require('winston')
const crypto = require('crypto')

const User = require('../models/User')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-routes' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

// Enhanced login rate limiting with progressive delays
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    })
  }
})

// Additional rate limiting for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: 'Too many registration attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'echolearn-api',
      audience: 'echolearn-client'
    }
  )
}

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    })
]

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

// Registration endpoint
router.post('/register', registrationLimiter, validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.info(`Registration validation failed: ${JSON.stringify(errors.array())}`)
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password, firstName, lastName } = req.body

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      logger.info(`Registration attempt with existing email: ${email}`)
      return res.status(400).json({
        error: 'User already exists with this email address'
      })
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      ipAddress: req.ip,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    })

    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    // Add token to user's active tokens
    await user.addActiveToken(token)

    logger.info(`New user registered: ${user.email}`)

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toSafeObject(),
      token
    })

  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Login endpoint
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user by email
    const user = await User.findByEmail(email).select('+password +loginAttempts +lockUntil')

    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`)
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn(`Login attempt on locked account: ${email}`)
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts'
      })
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`Login attempt on inactive account: ${email}`)
      return res.status(401).json({
        error: 'Account has been deactivated'
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for: ${email}`)
      
      // Increment login attempts
      await user.incLoginAttempts()
      
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Update last login
    user.lastLogin = new Date()
    user.ipAddress = req.ip
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    // Add token to user's active tokens
    await user.addActiveToken(token)

    logger.info(`Successful login for: ${email}`)

    res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
      token
    })

  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Remove token from user's active tokens
    await req.user.removeActiveToken(req.token)

    logger.info(`User logged out: ${req.user.email}`)

    res.json({
      message: 'Logout successful'
    })

  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      error: 'Logout failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    // Clear all active tokens
    await req.user.clearActiveTokens()

    logger.info(`User logged out from all devices: ${req.user.email}`)

    res.json({
      message: 'Logged out from all devices successfully'
    })

  } catch (error) {
    logger.error('Logout all error:', error)
    res.status(500).json({
      error: 'Logout failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject()
    })
  } catch (error) {
    logger.error('Profile fetch error:', error)
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'cream', 'blue', 'yellow', 'dark'])
    .withMessage('Invalid theme'),
  body('preferences.fontSize')
    .optional()
    .isInt({ min: 12, max: 24 })
    .withMessage('Font size must be between 12 and 24'),
  body('preferences.language')
    .optional()
    .isIn(['en-US', 'en-GB', 'zh-HK', 'zh-CN', 'zh-TW'])
    .withMessage('Invalid language')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { firstName, lastName, preferences } = req.body

    // Update user
    if (firstName) req.user.firstName = firstName
    if (lastName) req.user.lastName = lastName
    if (preferences) {
      req.user.preferences = { ...req.user.preferences, ...preferences }
    }

    await req.user.save()

    logger.info(`Profile updated for user: ${req.user.email}`)

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toSafeObject()
    })

  } catch (error) {
    logger.error('Profile update error:', error)
    res.status(500).json({
      error: 'Profile update failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  res.json({
    valid: true,
    user: req.user.toSafeObject()
  })
})

module.exports = router 