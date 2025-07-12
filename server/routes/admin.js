const express = require('express')
const { body, validationResult } = require('express-validator')
const winston = require('winston')
const User = require('../models/User')
const { requireRole } = require('../middleware/auth')

const router = express.Router()

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'admin-routes' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

// All admin routes require admin role (middleware applied in main server file)
// Additional role check for critical operations
const requireSuperAdmin = requireRole('admin')

// Get all users (paginated)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters'
      })
    }

    const users = await User.find({})
      .select('-password -emailVerificationToken -passwordResetToken -activeTokens')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments()

    logger.info(`Admin ${req.user.email} fetched users list`)

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Admin users fetch error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken -activeTokens')

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    logger.info(`Admin ${req.user.email} fetched user ${userId}`)

    res.json({
      success: true,
      user: user.toSafeObject()
    })

  } catch (error) {
    logger.error('Admin user fetch error:', error)
    res.status(500).json({
      error: 'Failed to fetch user',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Update user role
router.put('/users/:userId/role', requireSuperAdmin, [
  body('role')
    .isIn(['user', 'admin', 'teacher'])
    .withMessage('Invalid role. Must be user, admin, or teacher')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { userId } = req.params
    const { role } = req.body

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      })
    }

    // Prevent admins from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot change your own role'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    logger.info(`Admin ${req.user.email} changed user ${userId} role from ${oldRole} to ${role}`)

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: user.toSafeObject()
    })

  } catch (error) {
    logger.error('Admin role update error:', error)
    res.status(500).json({
      error: 'Failed to update user role',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Activate/deactivate user
router.put('/users/:userId/status', requireSuperAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { userId } = req.params
    const { isActive } = req.body

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      })
    }

    // Prevent admins from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot change your own status'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    user.isActive = isActive
    await user.save()

    // Clear user's active tokens if deactivating
    if (!isActive) {
      await user.clearActiveTokens()
    }

    logger.info(`Admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} user ${userId}`)

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toSafeObject()
    })

  } catch (error) {
    logger.error('Admin status update error:', error)
    res.status(500).json({
      error: 'Failed to update user status',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Delete user (soft delete by deactivating)
router.delete('/users/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      })
    }

    // Prevent admins from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot delete your own account'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Soft delete by deactivating
    user.isActive = false
    await user.save()

    // Clear user's active tokens
    await user.clearActiveTokens()

    logger.info(`Admin ${req.user.email} deleted user ${userId}`)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    logger.error('Admin user deletion error:', error)
    res.status(500).json({
      error: 'Failed to delete user',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const inactiveUsers = await User.countDocuments({ isActive: false })
    const usersByRole = await User.getUserCountByRole()

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})
      },
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    }

    logger.info(`Admin ${req.user.email} fetched system stats`)

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    logger.error('Admin stats fetch error:', error)
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Get recent activity logs (in a real implementation, this would come from a logs collection)
router.get('/activity-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters'
      })
    }

    // In a real implementation, you'd have a separate ActivityLog model
    // For now, return mock data
    const logs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        action: 'USER_LOGIN',
        userId: req.user._id,
        userEmail: req.user.email,
        details: 'User logged in successfully'
      }
    ]

    logger.info(`Admin ${req.user.email} fetched activity logs`)

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total: logs.length,
        pages: Math.ceil(logs.length / limit)
      }
    })

  } catch (error) {
    logger.error('Admin activity logs fetch error:', error)
    res.status(500).json({
      error: 'Failed to fetch activity logs',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Force logout user from all devices
router.post('/users/:userId/logout-all', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    await user.clearActiveTokens()

    logger.info(`Admin ${req.user.email} forced logout for user ${userId}`)

    res.json({
      success: true,
      message: 'User logged out from all devices successfully'
    })

  } catch (error) {
    logger.error('Admin force logout error:', error)
    res.status(500).json({
      error: 'Failed to logout user',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Search users
router.get('/search/users', async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      })
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters'
      })
    }

    // Search by email, first name, or last name
    const searchRegex = new RegExp(query, 'i')
    const searchCriteria = {
      $or: [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ]
    }

    const users = await User.find(searchCriteria)
      .select('-password -emailVerificationToken -passwordResetToken -activeTokens')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(searchCriteria)

    logger.info(`Admin ${req.user.email} searched users with query: ${query}`)

    res.json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    logger.error('Admin user search error:', error)
    res.status(500).json({
      error: 'Failed to search users',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

module.exports = router 