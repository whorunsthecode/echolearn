const jwt = require('jsonwebtoken')
const User = require('../models/User')
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-middleware' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      logger.warn(`Authentication failed: No token provided - IP: ${req.ip}`)
      return res.status(401).json({ error: 'Access token required' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      logger.warn(`Authentication failed: User not found - UserID: ${decoded.userId}`)
      return res.status(401).json({ error: 'Invalid token' })
    }

    if (!user.isActive) {
      logger.warn(`Authentication failed: Inactive user - UserID: ${decoded.userId}`)
      return res.status(401).json({ error: 'Account deactivated' })
    }

    // Check if token is in user's active tokens (for logout functionality)
    if (user.activeTokens && !user.activeTokens.includes(token)) {
      logger.warn(`Authentication failed: Token not in active tokens - UserID: ${decoded.userId}`)
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

// Require specific role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Role check failed: No user in request')
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (req.user.role !== requiredRole) {
      logger.warn(`Role check failed: User ${req.user._id} has role ${req.user.role}, required: ${requiredRole}`)
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Check if user has any of the required roles
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Role check failed: No user in request')
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Role check failed: User ${req.user._id} has role ${req.user.role}, required: ${roles.join(', ')}`)
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (user && user.isActive) {
      req.user = user
      req.token = token
    }

    next()
  } catch (error) {
    // Don't fail the request, just continue without user context
    next()
  }
}

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField]
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
      return next()
    }

    logger.warn(`Ownership check failed: User ${req.user._id} trying to access resource owned by ${resourceUserId}`)
    return res.status(403).json({ error: 'Access denied' })
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAnyRole,
  optionalAuth,
  requireOwnershipOrAdmin
} 