const express = require('express')
const { body, validationResult } = require('express-validator')
const rateLimit = require('express-rate-limit')
const winston = require('winston')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const router = express.Router()

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-routes' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
})

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each authenticated user to 10 AI requests per windowMs
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for rate limiting instead of IP
    return req.user ? req.user._id.toString() : req.ip
  }
})

// Initialize Gemini AI service
class SecureGeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY
    this.genAI = null
    this.model = null
    
    logger.info(`Gemini API Key status: ${this.apiKey ? 'SET' : 'NOT SET'}`)
    
    if (this.apiKey) {
      logger.info('Initializing Gemini AI model...')
      this.genAI = new GoogleGenerativeAI(this.apiKey)
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      logger.info('Gemini AI model initialized successfully')
    } else {
      logger.warn('GEMINI_API_KEY environment variable not set - falling back to demo mode')
    }
  }

  async generateSummary(transcript, userId) {
    logger.info(`Summary generation request from user: ${userId}`)
    
    if (!this.model) {
      logger.warn('Gemini model not initialized - using demo data')
      return this.getDemoSummary()
    }

    if (!transcript || transcript.trim().length < 10) {
      logger.warn('Transcript too short - using demo data')
      return this.getDemoSummary()
    }

    // Validate transcript length (prevent abuse)
    if (transcript.length > 50000) {
      throw new Error('Transcript too long. Maximum length is 50,000 characters.')
    }

    try {
      const prompt = `
Please create a concise summary of this educational content that is optimized for dyslexic learners:

"${transcript}"

Requirements for the summary:
- Use clear, simple language
- Break into 5-7 bullet points
- Keep each point to 1-2 sentences maximum
- Focus on key concepts and main ideas
- Use active voice when possible
- Avoid complex compound sentences

Return ONLY the bullet points, one per line, without bullet symbols.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Split into array and clean up
      const summaryPoints = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
      
      logger.info(`Summary generated successfully for user: ${userId}`)
      return summaryPoints
        
    } catch (error) {
      logger.error('Gemini summary generation failed:', {
        error: error.message,
        stack: error.stack,
        userId: userId,
        transcriptLength: transcript.length
      })
      throw error
    }
  }

  async generateQuestions(transcript, userId) {
    logger.info(`Questions generation request from user: ${userId}`)
    
    if (!this.model) {
      logger.warn('Gemini model not initialized - using demo data')
      return this.getDemoQuestions()
    }

    if (!transcript || transcript.trim().length < 10) {
      logger.warn('Transcript too short - using demo data')
      return this.getDemoQuestions()
    }

    // Validate transcript length (prevent abuse)
    if (transcript.length > 50000) {
      throw new Error('Transcript too long. Maximum length is 50,000 characters.')
    }

    try {
      const prompt = `
Create 3-5 multiple choice questions based on this educational content, designed for dyslexic learners:

"${transcript}"

Requirements:
- Questions should test understanding of key concepts
- Keep questions clear and concise (1-2 sentences max)
- Provide 4 answer options each
- Use simple, direct language
- Avoid tricks or overly complex wording
- Focus on comprehension rather than memorization

Format as JSON with this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]

Return ONLY valid JSON.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0])
        logger.info(`Questions generated successfully for user: ${userId}`)
        return questions
      } else {
        logger.warn('No valid JSON found in response')
        throw new Error('No valid JSON found in response')
      }
      
    } catch (error) {
      logger.error('Gemini question generation failed:', {
        error: error.message,
        stack: error.stack,
        userId: userId,
        transcriptLength: transcript.length
      })
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

const geminiService = new SecureGeminiService()

// Validation middleware
const validateTranscript = [
  body('transcript')
    .notEmpty()
    .withMessage('Transcript is required')
    .isLength({ min: 10, max: 50000 })
    .withMessage('Transcript must be between 10 and 50,000 characters')
    .trim()
    .escape()
]

// Generate summary endpoint
router.post('/generate-summary', aiLimiter, validateTranscript, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { transcript } = req.body
    const userId = req.user ? req.user._id : 'demo-user'

    const summary = await geminiService.generateSummary(transcript, userId)

    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Summary generation error:', {
      error: error.message,
      stack: error.stack,
      transcript: req.body.transcript ? req.body.transcript.substring(0, 100) + '...' : 'N/A'
    })
    
    if (error.message.includes('Transcript too long')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message
      })
    }

    // Fallback to demo data if API fails
    const demoSummary = geminiService.getDemoSummary()
    res.json({
      success: true,
      summary: demoSummary,
      timestamp: new Date().toISOString(),
      isDemoData: true,
      error: error.message // Include error message for debugging
    })
  }
})

// Generate questions endpoint
router.post('/generate-questions', aiLimiter, validateTranscript, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { transcript } = req.body
    const userId = req.user ? req.user._id : 'demo-user'

    const questions = await geminiService.generateQuestions(transcript, userId)

    res.json({
      success: true,
      questions,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Questions generation error:', {
      error: error.message,
      stack: error.stack,
      transcript: req.body.transcript ? req.body.transcript.substring(0, 100) + '...' : 'N/A'
    })
    
    if (error.message.includes('Transcript too long')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message
      })
    }

    // Fallback to demo data if API fails
    const demoQuestions = geminiService.getDemoQuestions()
    res.json({
      success: true,
      questions: demoQuestions,
      timestamp: new Date().toISOString(),
      isDemoData: true,
      error: error.message // Include error message for debugging
    })
  }
})

// Define word endpoint (for dictionary/definition lookup)
router.post('/define-word', aiLimiter, [
  body('word')
    .notEmpty()
    .withMessage('Word is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Word must be between 1 and 100 characters')
    .trim()
    .escape()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { word } = req.body
    const userId = req.user ? req.user._id : 'demo-user'

    logger.info(`Word definition request for "${word}" from user: ${userId}`)

    if (!geminiService.model) {
      // Fallback definition
      return res.json({
        success: true,
        definition: `${word}: Definition not available in demo mode.`,
        timestamp: new Date().toISOString(),
        isDemoData: true
      })
    }

    const prompt = `
Please provide a simple, clear definition of the word "${word}" that would be suitable for dyslexic learners.

Requirements:
- Use simple, easy-to-understand language
- Keep the definition to 1-2 sentences
- Avoid complex terminology
- Include pronunciation if helpful
- If the word has multiple meanings, provide the most common one

Return ONLY the definition, no additional text.
`

    const result = await geminiService.model.generateContent(prompt)
    const response = await result.response
    const definition = response.text().trim()

    res.json({
      success: true,
      word,
      definition,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Word definition error:', error)
    
    res.json({
      success: true,
      word: req.body.word,
      definition: `${req.body.word}: Definition not available at this time.`,
      timestamp: new Date().toISOString(),
      isDemoData: true
    })
  }
})

// Usage statistics endpoint (for monitoring)
router.get('/usage-stats', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'demo-user'
    
    // In a real implementation, you'd track usage in the database
    // For now, return placeholder data
    res.json({
      success: true,
      stats: {
        summariesGenerated: 0,
        questionsGenerated: 0,
        wordsLookedUp: 0,
        remainingRequests: 10 // This would be calculated based on rate limits
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Usage stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
})

// Debug endpoint to check API status
router.get('/debug-status', async (req, res) => {
  try {
    res.json({
      success: true,
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
      modelInitialized: !!geminiService.model,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Debug status error:', error)
    res.status(500).json({
      error: 'Failed to get debug status',
      message: error.message
    })
  }
})

module.exports = router 