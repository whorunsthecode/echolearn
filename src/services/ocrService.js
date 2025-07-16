import Tesseract from 'tesseract.js'

class OCRService {
  constructor() {
    this.worker = null
  }

  isSupportedFile(file) {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf']
    return supportedTypes.includes(file.type)
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async extractText(file, progressCallback = () => {}) {
    try {
      // Initialize worker if not already done
      if (!this.worker) {
        this.worker = await Tesseract.createWorker({
          logger: m => {
            if (m.status === 'recognizing text') {
              progressCallback(Math.round(m.progress * 100))
            }
          }
        })
      }

      // Perform OCR
      const { data: { text } } = await this.worker.recognize(file)
      
      progressCallback(100)
      return text.trim()
    } catch (error) {
      console.error('OCR Error:', error)
      throw new Error(`Failed to extract text: ${error.message}`)
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

// Export a singleton instance
const ocrService = new OCRService()
export default ocrService 