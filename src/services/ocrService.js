import Tesseract from 'tesseract.js';

class OCRService {
  constructor() {
    this.isInitialized = false;
    // Remove worker - we'll use direct recognition
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔧 Initializing workerless OCR service...');
      
      // Check if Tesseract is available
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract.js is not loaded');
      }
      
      console.log('✅ Tesseract.js is available');
      console.log('✅ OCR service initialized successfully (workerless mode)');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize OCR service:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      this.isInitialized = false;
      throw new Error(`OCR initialization failed: ${error.message}`);
    }
  }

  async preprocessImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      console.log('🖼️ Starting image preprocessing for:', file.name);
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error('❌ Image preprocessing timeout');
        reject(new Error('Image preprocessing timeout'));
      }, 30000);
      
      img.onload = () => {
        try {
          clearTimeout(timeout);
          console.log('📐 Image loaded successfully:', img.width, 'x', img.height);
          
          // Calculate optimal size - keep high resolution for better OCR
          const maxSize = 3000; // Increased from 2000
          let { width, height } = img;
          let scale = 1;
          
          // Only resize if too large
          if (width > maxSize || height > maxSize) {
            scale = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
            console.log('📏 Resizing image to:', width, 'x', height, 'Scale:', scale);
          } else {
            console.log('📏 Image size is good, no resizing needed');
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Apply better preprocessing
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Enhanced preprocessing for better OCR
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // Apply adaptive thresholding for better contrast
            // This helps with varying lighting conditions
            let processed;
            if (gray > 200) {
              processed = 255; // Pure white
            } else if (gray < 50) {
              processed = 0;   // Pure black
            } else if (gray > 140) {
              processed = 255; // Light gray becomes white
            } else {
              processed = 0;   // Dark gray becomes black
            }
            
            data[i] = processed;     // Red
            data[i + 1] = processed; // Green
            data[i + 2] = processed; // Blue
            // Alpha channel stays the same
          }
          
          // Put the processed image data back
          ctx.putImageData(imageData, 0, 0);
          
          console.log('✅ Image preprocessing completed');
          
          // Convert canvas to blob with high quality
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('✅ Canvas converted to blob, size:', blob.size);
              resolve(blob);
            } else {
              console.error('❌ Failed to create blob from canvas');
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png', 1.0); // High quality PNG
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Image preprocessing error:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Image loading error:', error);
        reject(new Error('Failed to load image'));
      };
      
      try {
        img.src = URL.createObjectURL(file);
        console.log('📁 Created object URL for image');
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Failed to create object URL:', error);
        reject(new Error('Failed to create object URL'));
      }
    });
  }

  async extractTextFromImage(file, onProgress = null) {
    try {
      console.log('🚀 Starting workerless OCR process for:', file.name);
      console.log('📊 File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Initialize with progress feedback
      if (onProgress) onProgress(5);
      console.log('🔧 Initializing workerless OCR...');
      await this.initialize();
      
      if (onProgress) onProgress(15);
      console.log('🖼️ Preprocessing image...');
      const preprocessedFile = await this.preprocessImage(file);
      
      if (onProgress) onProgress(25);
      console.log('🔍 Starting workerless OCR extraction...');
      
      // Use Tesseract.recognize directly without worker (this is the key fix!)
      const result = await Tesseract.recognize(preprocessedFile, 'eng', {
        logger: (m) => {
          console.log('📊 OCR Progress:', m.status, m.progress || '');
          if (onProgress && m.status === 'recognizing text') {
            onProgress(Math.round(25 + (m.progress * 75)));
          }
        }
      });
      
      console.log('✅ Workerless OCR extraction completed');
      console.log('📝 Raw result:', result);
      console.log('📝 Confidence:', result.data.confidence);
      console.log('📝 Extracted text length:', result.data.text.length);
      console.log('📝 Extracted text preview:', result.data.text.substring(0, 200) + '...');
      
      // Clean up the extracted text
      let extractedText = result.data.text
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/\s{2,}/g, ' ')    // Replace multiple spaces with single space
        .trim();
      
      // Post-process to fix common OCR errors
      extractedText = this.postProcessText(extractedText);
      
      console.log('📝 Cleaned text length:', extractedText.length);
      console.log('📝 Cleaned text preview:', extractedText.substring(0, 200) + '...');
      
      if (!extractedText || extractedText.length < 10) {
        console.warn('⚠️ Very little text extracted from image');
        throw new Error('Very little text could be extracted from the image. Please try a clearer image with better contrast and larger text.');
      }
      
      console.log('✅ Workerless OCR successful, returning text');
      return extractedText;
    } catch (error) {
      console.error('❌ Workerless OCR extraction failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Don't fall back to demo text - throw the actual error
      throw error;
    }
  }

  postProcessText(text) {
    // Fix common OCR errors
    return text
      .replace(/\bI\b/g, 'I')      // Fix standalone I
      .replace(/\bl\b/g, 'I')      // Fix l that should be I
      .replace(/\b0\b/g, 'O')      // Fix 0 that should be O
      .replace(/\bO\b/g, 'O')      // Fix O
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Fix punctuation spacing
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  async extractTextFromPDF(file, onProgress = null) {
    // For PDF files, we'll need to convert them to images first
    // This is a simplified implementation - in a real app, you'd use PDF.js
    throw new Error('PDF support not implemented yet. Please convert your PDF to images first.');
  }

  async extractText(file, onProgress = null) {
    const fileType = file.type;
    
    console.log('📁 Starting text extraction for:', file.name, 'Type:', fileType);
    
    try {
      if (fileType.startsWith('image/')) {
        return await this.extractTextFromImage(file, onProgress);
      } else if (fileType === 'application/pdf') {
        return await this.extractTextFromPDF(file, onProgress);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw error;
    }
  }

  async cleanup() {
    // No worker to cleanup in workerless mode
    console.log('🧹 OCR service cleanup completed (workerless mode)');
  }

  isSupportedFile(file) {
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf'
    ];
    return supportedTypes.includes(file.type);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new OCRService(); 