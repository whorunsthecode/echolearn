class SpeechService {
  constructor() {
    this.recognition = null
    this.isSupported = false
    
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.isSupported = true
      
      // Configure for education/Hong Kong context
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US' // Can be changed to 'zh-HK' for Cantonese
      this.recognition.maxAlternatives = 1
    }
  }

  async transcribeAudioFile(audioFile) {
    // For file upload, we'll use demo data since Web Speech API 
    // doesn't work with files directly. In production, you'd use
    // Google Cloud Speech-to-Text API here.
    
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        resolve(this.getDemoTranscript())
      }, 2000)
    })
  }

  startRealTimeTranscription(onTranscript, onError) {
    if (!this.isSupported) {
      onError('Speech recognition not supported in this browser')
      return null
    }

    let finalTranscript = ''
    let interimTranscript = ''

    this.recognition.onresult = (event) => {
      interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
      
      // Send both final and interim results
      onTranscript({
        final: finalTranscript.trim(),
        interim: interimTranscript,
        complete: finalTranscript + interimTranscript
      })
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      onError(`Speech recognition error: ${event.error}`)
    }

    this.recognition.onend = () => {
      // If we have some transcript, use it, otherwise fall back to demo
      if (finalTranscript.trim().length > 0) {
        onTranscript({
          final: finalTranscript.trim(),
          interim: '',
          complete: finalTranscript.trim(),
          isComplete: true
        })
      } else {
        // Fallback to demo content if no speech detected
        setTimeout(() => {
          onTranscript({
            final: this.getDemoTranscript(),
            interim: '',
            complete: this.getDemoTranscript(),
            isComplete: true
          })
        }, 1000)
      }
    }

    try {
      this.recognition.start()
      return this.recognition
    } catch (error) {
      onError(`Failed to start speech recognition: ${error.message}`)
      return null
    }
  }

  stopTranscription() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  // Demo content for fallback
  getDemoTranscript() {
    return `Welcome to today's lesson on the water cycle. The water cycle, also known as the hydrological cycle, describes the continuous movement of water on, above and below the surface of the Earth.

The water cycle consists of four main stages: evaporation, condensation, precipitation, and collection. During evaporation, heat from the sun causes water in oceans, lakes, and rivers to turn into water vapor that rises into the atmosphere.

Condensation occurs when this water vapor cools and forms tiny droplets around particles in the air, creating clouds. When these droplets become too heavy, they fall back to Earth as precipitation in the form of rain, snow, sleet, or hail.

Finally, the water collects in bodies of water and the cycle begins again. This process is essential for all life on Earth and helps distribute heat around our planet.`
  }

  // Language options for Hong Kong context
  setLanguage(language) {
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'zh-HK', name: 'Cantonese (Hong Kong)' },
      { code: 'zh-CN', name: 'Mandarin (Simplified)' },
      { code: 'zh-TW', name: 'Mandarin (Traditional)' }
    ]
  }
}

export default new SpeechService() 