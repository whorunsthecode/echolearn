// Secure API Service - Handles authentication and secure API calls
class SecureApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '
  http://localhost:5001/api'
    this.token = localStorage.getItem('authToken')
    this.user = null
    
    // Try to load user from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        this.clearAuth()
      }
    }
  }

  // Authentication methods
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      this.token = data.token
      this.user = data.user
      localStorage.setItem('authToken', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      this.token = data.token
      this.user = data.user
      localStorage.setItem('authToken', this.token)
      localStorage.setItem('user', JSON.stringify(this.user))

      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuth()
    }
  }

  async verifyToken() {
    if (!this.token) {
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        this.clearAuth()
        return false
      }

      const data = await response.json()
      this.user = data.user
      localStorage.setItem('user', JSON.stringify(this.user))
      return true
    } catch (error) {
      console.error('Token verification error:', error)
      this.clearAuth()
      return false
    }
  }

  clearAuth() {
    this.token = null
    this.user = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  isAuthenticated() {
    return !!this.token && !!this.user
  }

  getUser() {
    return this.user
  }

  isAdmin() {
    return this.user && this.user.role === 'admin'
  }

  // Generic API call method
  async makeSecureRequest(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('No authentication token available')
    }

    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearAuth()
          throw new Error('Authentication failed. Please login again.')
        }
        throw new Error(data.error || `Request failed with status ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // AI service methods
  async generateSummary(transcript) {
    try {
      const response = await this.makeSecureRequest('/ai/generate-summary', {
        method: 'POST',
        body: JSON.stringify({ transcript }),
      })

      return response.summary
    } catch (error) {
      console.error('Summary generation error:', error)
      
      // Fallback to demo data if API fails
      return this.getDemoSummary()
    }
  }

  async generateQuestions(transcript) {
    try {
      const response = await this.makeSecureRequest('/ai/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ transcript }),
      })

      return response.questions
    } catch (error) {
      console.error('Questions generation error:', error)
      
      // Fallback to demo data if API fails
      return this.getDemoQuestions()
    }
  }

  async defineWord(word) {
    try {
      const response = await this.makeSecureRequest('/ai/define-word', {
        method: 'POST',
        body: JSON.stringify({ word }),
      })

      return response.definition
    } catch (error) {
      console.error('Word definition error:', error)
      return `${word}: Definition not available at this time.`
    }
  }

  async getUsageStats() {
    try {
      const response = await this.makeSecureRequest('/ai/usage-stats')
      return response.stats
    } catch (error) {
      console.error('Usage stats error:', error)
      return null
    }
  }

  // Profile management
  async updateProfile(profileData) {
    try {
      const response = await this.makeSecureRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      this.user = response.user
      localStorage.setItem('user', JSON.stringify(this.user))
      return response
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Admin methods
  async getUsers(page = 1, limit = 10) {
    if (!this.isAdmin()) {
      throw new Error('Admin access required')
    }

    try {
      const response = await this.makeSecureRequest(`/admin/users?page=${page}&limit=${limit}`)
      return response
    } catch (error) {
      console.error('Get users error:', error)
      throw error
    }
  }

  async updateUserRole(userId, role) {
    if (!this.isAdmin()) {
      throw new Error('Admin access required')
    }

    try {
      const response = await this.makeSecureRequest(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      })
      return response
    } catch (error) {
      console.error('Update user role error:', error)
      throw error
    }
  }

  async toggleUserStatus(userId, isActive) {
    if (!this.isAdmin()) {
      throw new Error('Admin access required')
    }

    try {
      const response = await this.makeSecureRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      })
      return response
    } catch (error) {
      console.error('Toggle user status error:', error)
      throw error
    }
  }

  async getSystemStats() {
    if (!this.isAdmin()) {
      throw new Error('Admin access required')
    }

    try {
      const response = await this.makeSecureRequest('/admin/stats')
      return response.stats
    } catch (error) {
      console.error('Get system stats error:', error)
      throw error
    }
  }

  // Demo data fallbacks
  getDemoSummary() {
    return [
      "The water cycle describes continuous water movement on Earth",
      "Four main stages: evaporation, condensation, precipitation, collection",
      "Evaporation: Sun heats water, turning it to vapor",
      "Condensation: Water vapor cools and forms clouds", 
      "Precipitation: Water falls as rain, snow, sleet, or hail",
      "Collection: Water gathers in bodies of water, cycle repeats",
      "Essential for all life and helps distribute heat globally"
    ]
  }

  getDemoQuestions() {
    return [
      {
        question: "What are the four main stages of the water cycle?",
        options: [
          "Evaporation, condensation, precipitation, collection",
          "Heating, cooling, freezing, melting", 
          "Rain, snow, sleet, hail",
          "Oceans, lakes, rivers, streams"
        ],
        correct: 0
      },
      {
        question: "What causes evaporation in the water cycle?",
        options: [
          "Wind from storms",
          "Heat from the sun",
          "Cold temperatures", 
          "Ocean currents"
        ],
        correct: 1
      },
      {
        question: "What happens during condensation?",
        options: [
          "Water falls from clouds",
          "Water heats up and rises",
          "Water vapor cools and forms clouds",
          "Water collects in rivers"
        ],
        correct: 2
      }
    ]
  }
}

export default new SecureApiService() 