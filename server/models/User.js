const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'teacher'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  activeTokens: [{
    type: String,
    select: false
  }],
  lastLogin: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'cream', 'blue', 'yellow', 'dark'],
      default: 'light'
    },
    fontSize: {
      type: Number,
      default: 16,
      min: 12,
      max: 24
    },
    language: {
      type: String,
      enum: ['en-US', 'en-GB', 'zh-HK', 'zh-CN', 'zh-TW'],
      default: 'en-US'
    }
  }
}, {
  timestamps: true
})

// Indexes for performance and security (email index handled by unique: true)
userSchema.index({ loginAttempts: 1, lockUntil: 1 })

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12)
    this.password = hashedPassword
    next()
  } catch (error) {
    next(error)
  }
})

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates = { $inc: { loginAttempts: 1 } }
  
  // Account gets locked after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours lock
  }
  
  return this.updateOne(updates)
}

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

// Method to add active token
userSchema.methods.addActiveToken = function(token) {
  if (!this.activeTokens) {
    this.activeTokens = []
  }
  this.activeTokens.push(token)
  return this.save()
}

// Method to remove active token
userSchema.methods.removeActiveToken = function(token) {
  if (!this.activeTokens) {
    return Promise.resolve()
  }
  this.activeTokens = this.activeTokens.filter(t => t !== token)
  return this.save()
}

// Method to clear all active tokens (for logout all devices)
userSchema.methods.clearActiveTokens = function() {
  this.activeTokens = []
  return this.save()
}

// Method to get safe user object (without sensitive data)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject()
  delete userObject.password
  delete userObject.emailVerificationToken
  delete userObject.passwordResetToken
  delete userObject.passwordResetExpires
  delete userObject.activeTokens
  delete userObject.loginAttempts
  delete userObject.lockUntil
  return userObject
}

// Static method to find by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

// Static method to get user count by role
userSchema.statics.getUserCountByRole = function() {
  return this.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ])
}

const User = mongoose.model('User', userSchema)

module.exports = User 