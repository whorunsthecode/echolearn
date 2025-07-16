import secureApiService from './secureApiService.js'

class GeminiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
    console.log('🔧 Gemini Service initialized with base URL:', this.baseURL)
    this.checkApiStatus()
  }

  async checkApiStatus() {
    try {
      const response = await fetch(`${this.baseURL}/ai/debug-status`)
      if (response.ok) {
        const data = await response.json()
        if (data.apiKeyConfigured) {
          console.log('✅ Gemini API Key is configured - AI features will work')
        } else {
          console.warn('⚠️ Gemini API Key not configured - will use demo data')
          console.info('ℹ️ To enable AI features, get a free API key from: https://makersuite.google.com/app/apikey')
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check API status - backend may not be running')
    }
  }

  async generateSummary(transcript) {
    console.log('🔍 Generating summary...')
    console.log('📝 Transcript length:', transcript.length)
    console.log('📝 Transcript preview:', transcript.substring(0, 100) + '...')

    try {
      // Try direct API call first (without authentication)
      const response = await fetch(`${this.baseURL}/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      console.log('📡 API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Summary generated successfully via direct API')
        return data.summary
      } else {
        console.warn('⚠️ Direct API failed, trying secure API...')
        throw new Error('Direct API failed')
      }
    } catch (error) {
      console.error('❌ Direct API failed:', error)
      
      try {
        // Fallback to secure API service
        const summary = await secureApiService.generateSummary(transcript)
        console.log('✅ Summary generated via secure API')
        return summary
      } catch (secureError) {
        console.error('❌ Secure API also failed:', secureError)
        console.log('📋 Falling back to demo data')
        return this.getDemoSummary()
      }
    }
  }

  async generateQuestions(transcript) {
    console.log('🔍 Generating questions...')
    console.log('📝 Transcript length:', transcript.length)
    console.log('📝 Transcript preview:', transcript.substring(0, 100) + '...')

    try {
      // Try direct API call first (without authentication)
      const response = await fetch(`${this.baseURL}/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      console.log('📡 API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Questions generated successfully via direct API')
        return data.questions
      } else {
        console.warn('⚠️ Direct API failed, trying secure API...')
        throw new Error('Direct API failed')
      }
    } catch (error) {
      console.error('❌ Direct API failed:', error)
      
      try {
        // Fallback to secure API service
        const questions = await secureApiService.generateQuestions(transcript)
        console.log('✅ Questions generated via secure API')
        return questions
      } catch (secureError) {
        console.error('❌ Secure API also failed:', secureError)
        console.log('📋 Falling back to demo data')
        return this.getDemoQuestions()
      }
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

export default new GeminiService() 