import React, { useState, useRef, useEffect } from 'react'
import { 
  Upload, FileText, Brain, Eye, Type, Volume2, VolumeX, 
  Keyboard, Copy, Check, Settings, ChevronDown, Play, Pause,
  ArrowRight, Download, AlertCircle, FileImage, FilePlus, HelpCircle,
  Focus, Minimize2, MousePointer, Accessibility
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import geminiService from './services/geminiService.js'
import speechService from './services/speechService.js'
import ocrService from './services/ocrService.js'

// Theme configuration with improved accessibility and WCAG AAA compliance
const colorThemes = {
  'default': {
    name: 'Default',
    bg: '#ffffff',
    text: '#1a1a1a', // Improved contrast: avoid pure black, use dark gray
    border: '#d4d4d4',
    cardBg: '#ffffff',
    accent: '#1976D2' // Darker blue for better contrast on light backgrounds
  },
  'warm-beige': {
    name: 'Warm Beige',
    bg: '#FDF6E3', // Warm cream base
    text: '#2C1810', // Dark brown for 15.4:1 contrast ratio
    border: '#D4B896', // Warm brown border
    cardBg: '#F4E8D0', // Slightly darker cream for cards
    accent: '#1976D2' // Darker blue for better contrast on light
  },
  'dark': {
    name: 'Dark',
    bg: '#1a1a1a', // True dark for better contrast
    text: '#ffffff', // Pure white for maximum contrast - 21:1 ratio
    border: '#444444', // Visible borders with 4.7:1 contrast
    cardBg: '#2d2d2d', // Secondary background for cards/panels
    accent: '#4A90E2' // Accessible blue for interactive elements
  }
}



// Progress Steps Component with Equal Spacing and Enhanced Visual Hierarchy
const ProgressSteps = ({ currentStep, theme }) => {
  const steps = [
    { id: 1, title: 'Upload Content', icon: Upload },
    { id: 2, title: 'Extract Text', icon: FileText },
    { id: 3, title: 'AI Summary', icon: Brain },
    { id: 4, title: 'AI MCQs and Spelling Quiz', icon: Type }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between relative">
        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isPending = currentStep < step.id
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10" style={{ flex: '1' }}>
              {/* Step Circle */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white relative"
                style={{
                  backgroundColor: isCompleted 
                    ? '#4CAF50' // Success green for completed
                    : isActive 
                    ? (theme?.accent || '#4A90E2') // Theme accent for active
                    : '#666666' // Gray for inactive
                }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </div>
              
              {/* Step Label */}
              <span 
                className="text-sm font-medium mt-2 text-center max-w-24 leading-tight"
                style={{ 
                  color: theme?.text || '#333',
                  fontSize: '14px'
                }}
              >
                {step.title}
              </span>
              
              {/* Connection Line - Only render if not the last step */}
              {index < steps.length - 1 && (
                <div 
                  className="absolute top-6 left-full w-full h-0.5 z-0"
                  style={{
                    backgroundColor: currentStep > step.id 
                      ? '#4CAF50' // Green for completed sections
                      : currentStep === step.id 
                      ? (theme?.accent || '#4A90E2') // Blue for active section
                      : '#666666', // Gray for inactive sections
                    marginLeft: '24px',
                    marginRight: '24px',
                    width: 'calc(100% - 48px)'
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Theme Preview Component
const ThemePreview = ({ theme, isSelected, onClick }) => {
  return (
    <div
      className={`theme-preview ${isSelected ? 'selected' : ''}`}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        borderColor: isSelected ? '#2563eb' : theme.border
      }}
      onClick={onClick}
    >
      <div className="theme-title">{theme.name}</div>
      <div className="theme-text">Sample text with improved readability</div>
    </div>
  )
}

// Reading Preferences Modal Component
const ReadingPreferencesModal = ({ 
  isOpen, 
  onClose, 
  theme, 
  fontFamily, 
  setFontFamily, 
  fontSize, 
  setFontSize, 
  lineHeight, 
  setLineHeight, 
  colorTheme, 
  setColorTheme,
  colorThemes 
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-90vh overflow-y-auto"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          color: theme.text
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
            Reading Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{ backgroundColor: 'transparent' }}
            aria-label="Close preferences"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Font Style */}
          <div className="form-group">
            <label className="form-label">Font Style</label>
            <select
              className="form-select w-full"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              <option value="'OpenDyslexic', 'Inter', Arial, sans-serif">OpenDyslexic (Specialized for Dyslexia)</option>
              <option value="'Inter', Arial, sans-serif">Inter (Dyslexia-Friendly)</option>
              <option value="Verdana, sans-serif">Verdana (High Readability)</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
            </select>
          </div>

          {/* Text Size */}
          <div className="form-group">
            <label className="form-label">
              Text Size: {fontSize}px {fontSize < 16 ? '(Below recommended minimum)' : ''}
            </label>
            <input
              type="range"
              min="14"
              max="28"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="slider w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Recommended: 16px minimum for dyslexia accessibility
            </div>
          </div>

          {/* Line Spacing */}
          <div className="form-group">
            <label className="form-label">
              Line Spacing: {lineHeight} {lineHeight >= 1.5 ? '✓' : '(Below recommended)'}
            </label>
            <input
              type="range"
              min="1.2"
              max="1.8"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="slider w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Recommended: 1.5-1.8 for optimal readability
            </div>
          </div>

          {/* Color Theme */}
          <div className="form-group">
            <label className="form-label">Color Theme</label>
            <div className="space-y-2">
              {Object.entries(colorThemes).map(([key, themeOption]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="colorTheme"
                    value={key}
                    checked={colorTheme === key}
                    onChange={() => setColorTheme(key)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{themeOption.name}</span>
                  <div 
                    className="w-6 h-6 rounded-full border-2"
                    style={{ 
                      backgroundColor: themeOption.accent,
                      borderColor: themeOption.border
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
            style={{
              backgroundColor: theme.accent,
              color: 'white'
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

// Keyboard Shortcuts Modal Component  
const KeyboardShortcutsModal = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null

  const shortcuts = {
    navigation: [
      { keys: ['Ctrl', 'U'], description: 'Upload Files' },
      { keys: ['Ctrl', 'S'], description: 'Generate Summary' },
      { keys: ['Ctrl', 'T'], description: 'Read Aloud' },
      { keys: ['Ctrl', 'Q'], description: 'Create Quiz' },
      { keys: ['Ctrl', 'F'], description: 'Focus Mode' },
      { keys: ['Ctrl', 'D'], description: 'Distraction-Free' }
    ],
    general: [
      { keys: ['Esc'], description: 'Exit Current Mode' },
      { keys: ['Click'], description: 'Word Definitions' }
    ]
  }

  const renderShortcut = (shortcut, index) => (
    <div key={index} className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        {shortcut.keys.map((key, keyIndex) => (
          <kbd 
            key={keyIndex}
            className="px-2 py-1 text-xs font-mono rounded border"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              color: theme.text,
              fontFamily: 'monospace'
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-sm" style={{ color: theme.text }}>
        {shortcut.description}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-90vh overflow-y-auto"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          color: theme.text
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{ backgroundColor: 'transparent' }}
            aria-label="Close shortcuts"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Navigation Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: theme.text }}>
              Navigation
            </h3>
            <div className="space-y-1">
              {shortcuts.navigation.map(renderShortcut)}
            </div>
          </div>

          {/* General Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: theme.text }}>
              General
            </h3>
            <div className="space-y-1">
              {shortcuts.general.map(renderShortcut)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              borderColor: theme.accent,
              color: theme.accent
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Upload Zone Component with Improved Affordances
const UploadZone = ({ onFileUpload, isProcessing, progress, error, theme }) => {
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef(null)
  
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop: onFileUpload,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true // We'll handle click separately for better control
  })

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const getUploadZoneStyle = () => {
    let borderStyle = '2px dashed'
    let borderColor = theme?.border || '#d1d5db'
    let backgroundColor = theme?.cardBg || '#ffffff'
    
    if (isDragActive) {
      if (isDragAccept) {
        borderStyle = '2px solid'
        borderColor = '#10b981' // Green for accepted files
        backgroundColor = '#f0fdf4'
      } else if (isDragReject) {
        borderStyle = '2px solid'
        borderColor = '#ef4444' // Red for rejected files
        backgroundColor = '#fef2f2'
      }
    } else if (isHovered) {
      borderStyle = '2px solid'
      borderColor = theme?.accent || '#3b82f6'
      backgroundColor = theme?.bg || '#f9fafb'
    }

    return {
      border: `${borderStyle} ${borderColor}`,
      backgroundColor,
      color: theme?.text || '#1f2937'
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Drag & Drop Area */}
      <div
        {...getRootProps()}
        className="relative rounded-lg p-8 transition-all duration-200 cursor-pointer"
        style={getUploadZoneStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="flex flex-col items-center space-y-6">
          {/* Upload Icon with Animation */}
          <div className="relative">
            <div 
              className={`p-4 rounded-full transition-all duration-300 ${
                isDragActive ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'
              }`}
              style={{
                backgroundColor: isDragActive 
                  ? (isDragAccept ? '#10b981' : '#ef4444')
                  : theme?.accent || '#3b82f6',
                opacity: isDragActive ? 0.9 : 0.8
              }}
            >
              <Upload 
                size={32} 
                className={`text-white transition-transform duration-300 ${
                  isDragActive ? 'animate-bounce' : ''
                }`}
              />
            </div>
          </div>

          {/* Dynamic Text Content */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold" style={{ color: theme?.text }}>
              {isDragActive 
                ? (isDragAccept ? 'Drop files here!' : 'File type not supported') 
                : 'Upload your documents'
              }
            </h3>
            <p className="text-sm" style={{ color: theme?.text, opacity: 0.7 }}>
              {isDragActive 
                ? (isDragAccept ? 'Release to upload your file' : 'Only images and PDFs are supported')
                : 'Drag and drop files here, or browse to select'
              }
            </p>
            <p className="text-xs" style={{ color: theme?.text, opacity: 0.6 }}>
              Supports JPG, PNG, GIF, BMP, WebP, and PDF files (up to 10MB)
            </p>
          </div>

          {/* Browse Files Button */}
          {!isDragActive && (
            <button
              onClick={handleBrowseClick}
              className="btn-primary px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: theme?.accent || '#3b82f6',
                color: 'white'
              }}
            >
              <FileImage className="w-4 h-4 mr-2" />
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Progress Indicator */}
      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border p-4"
          style={{
            backgroundColor: theme?.cardBg,
            borderColor: theme?.border,
            color: theme?.text
          }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="animate-spin rounded-full h-5 w-5 border-b-2"
              style={{ borderColor: theme?.accent || '#3b82f6' }}
            ></div>
            <span className="text-sm font-medium">
              Extracting text from your document... {progress}%
            </span>
          </div>
          <div 
            className="w-full rounded-full h-2"
            style={{ backgroundColor: theme?.border || '#e5e7eb' }}
          >
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                backgroundColor: theme?.accent || '#3b82f6'
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try uploading a different file
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Reading Focus Tool Component
const ReadingFocusTool = ({ text, theme, fontSize, lineHeight, fontFamily, isActive, onToggle }) => {
  const [focusLine, setFocusLine] = useState(0)
  const textRef = useRef(null)
  const [textLines, setTextLines] = useState([])

  useEffect(() => {
    if (text && textRef.current) {
      // Split text into lines for focus mode
      const lines = text.split('\n').filter(line => line.trim())
      setTextLines(lines)
    }
  }, [text])

  const handleLineClick = (lineIndex) => {
    setFocusLine(lineIndex)
  }

  const nextLine = () => {
    setFocusLine(prev => Math.min(textLines.length - 1, prev + 1))
  }

  const prevLine = () => {
    setFocusLine(prev => Math.max(0, prev - 1))
  }

  if (!isActive || !text) return null

  return (
    <div className="reading-focus-container">
      {/* Focus Controls */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-lg border" style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border 
      }}>
        <div className="flex items-center space-x-2">
          <Focus className="w-5 h-5" style={{ color: theme.accent }} />
          <span className="font-medium" style={{ color: theme.text }}>
            Reading Focus: Line {focusLine + 1} of {textLines.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="btn-tertiary"
            onClick={prevLine}
            disabled={focusLine === 0}
            aria-label="Previous line"
          >
            ↑
          </button>
          <button
            className="btn-tertiary"
            onClick={nextLine}
            disabled={focusLine === textLines.length - 1}
            aria-label="Next line"
          >
            ↓
          </button>
          <button
            className="btn-tertiary"
            onClick={onToggle}
            aria-label="Exit focus mode"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Focused Text Display */}
      <div 
        ref={textRef}
        className="focused-text-display"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          fontFamily: fontFamily,
          color: theme.text
        }}
        role="textbox"
        aria-live="polite"
        aria-label="Focused reading area"
      >
        {textLines.map((line, index) => (
          <div
            key={index}
            className={`reading-line ${index === focusLine ? 'focused-line' : 'dimmed-line'}`}
            style={{
              padding: '8px 12px',
              margin: '2px 0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: index === focusLine ? theme.accent + '20' : 'transparent',
              opacity: index === focusLine ? 1 : 0.3,
              border: index === focusLine ? `2px solid ${theme.accent}` : '2px solid transparent'
            }}
            onClick={() => handleLineClick(index)}
            tabIndex="0"
            role="button"
            aria-label={`Line ${index + 1}: ${line}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleLineClick(index)
              }
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

// Word Definition Popup Component
const WordDefinitionPopup = ({ word, position, onClose, theme }) => {
  const [definition, setDefinition] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call for word definition
    const fetchDefinition = async () => {
      setIsLoading(true)
      // Mock definition - in real app, this would call a dictionary API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockDefinitions = {
        'water': 'A transparent, colorless liquid that forms the basis of fluids in living organisms.',
        'cycle': 'A series of events that are regularly repeated in the same order.',
        'evaporation': 'The process by which liquid water becomes water vapor.',
        'condensation': 'The process by which water vapor becomes liquid water.',
        'precipitation': 'Any form of water that falls from clouds, such as rain or snow.',
        'collection': 'The action of gathering water in lakes, rivers, and oceans.'
      }
      
      setDefinition(mockDefinitions[word.toLowerCase()] || `Definition for "${word}" not found. This is a placeholder for dictionary lookup.`)
      setIsLoading(false)
    }

    fetchDefinition()
  }, [word])

  if (!word || !position) return null

  return (
    <div
      className="word-definition-popup fixed z-50 p-4 rounded-lg shadow-lg border max-w-sm"
      style={{
        top: position.y + 20,
        left: position.x,
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
        color: theme.text
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg" style={{ color: theme.accent }}>
          {word}
        </h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close definition"
        >
          ×
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Loading definition...</span>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-3">{definition}</p>
          <button
            className="btn-secondary text-xs"
            onClick={() => {
              const utterance = new SpeechSynthesisUtterance(word)
              utterance.rate = 0.8
              window.speechSynthesis.speak(utterance)
            }}
          >
            <Volume2 className="w-3 h-3 mr-1" />
            Pronounce
          </button>
        </div>
      )}
    </div>
  )
}

// Enhanced Text Display with Word Clicking and Highlighting
const EnhancedTextDisplay = ({ text, theme, fontSize, lineHeight, fontFamily, focusMode, onWordClick, highlightRange }) => {
  if (focusMode) {
    return (
      <ReadingFocusTool
        text={text}
        theme={theme}
        fontSize={fontSize}
        lineHeight={lineHeight}
        fontFamily={fontFamily}
        isActive={focusMode}
        onToggle={() => {}} // Will be handled by parent
      />
    )
  }

  const handleTextClick = (e) => {
    if (!onWordClick) return
    
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()
    
    if (selectedText && selectedText.split(' ').length === 1) {
      // Single word selected
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      onWordClick(selectedText, {
        x: rect.left,
        y: rect.top
      })
    }
  }

  // Render text with highlighting for speech
  const renderTextWithHighlight = () => {
    if (!highlightRange || !text) {
      return text
    }

    const beforeHighlight = text.substring(0, highlightRange.start)
    const highlighted = text.substring(highlightRange.start, highlightRange.end)
    const afterHighlight = text.substring(highlightRange.end)

    return (
      <>
        {beforeHighlight}
        <span 
          className="speech-highlight"
          style={{
            backgroundColor: theme.accent + '40',
            padding: '2px 4px',
            borderRadius: '4px',
            border: `2px solid ${theme.accent}`,
            animation: 'pulse 1s infinite'
          }}
        >
          {highlighted}
        </span>
        {afterHighlight}
      </>
    )
  }

  return (
    <div
      className="enhanced-text-display cursor-pointer select-text"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        fontFamily: fontFamily,
        color: theme.text
      }}
      onClick={handleTextClick}
      role="textbox"
      aria-label="Text content - click on words for definitions"
      aria-live="polite"
    >
      {renderTextWithHighlight()}
    </div>
  )
}

// Spelling Quiz Component
const SpellingQuizSection = ({ words, theme, fontSize, lineHeight, fontFamily }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showResults, setShowResults] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentWord = words[currentWordIndex]

  const speakWord = (word) => {
    if (isPlaying) return
    
    setIsPlaying(true)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.7
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    
    window.speechSynthesis.speak(utterance)
  }

  const checkSpelling = () => {
    const isCorrect = userInput.toLowerCase().trim() === currentWord.word.toLowerCase()
    
    if (isCorrect) {
      setFeedback('Great job! You spelled it right. 🎉')
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
    } else {
      setFeedback(`Not quite. The correct spelling is: "${currentWord.word}". Try again! 💪`)
      setScore(prev => ({ ...prev, total: prev.total + 1 }))
    }

    // Move to next word after a brief delay
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1)
        setUserInput('')
        setFeedback('')
      } else {
        setShowResults(true)
      }
    }, 2000)
  }

  const skipWord = () => {
    setScore(prev => ({ ...prev, total: prev.total + 1 }))
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
      setFeedback('')
    } else {
      setShowResults(true)
    }
  }

  const resetQuiz = () => {
    setCurrentWordIndex(0)
    setUserInput('')
    setFeedback('')
    setScore({ correct: 0, total: 0 })
    setShowResults(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userInput.trim()) {
      checkSpelling()
    }
  }

  useEffect(() => {
    if (currentWord && currentWordIndex === 0) {
      // Speak the first word automatically
      setTimeout(() => speakWord(currentWord.word), 1000)
    }
  }, [currentWordIndex])

  if (words.length === 0) return null

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          {/* Progress Indicator */}
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: theme.text }}
            >
              Word {currentWordIndex + 1} of {words.length}
            </span>
            <div className="text-sm" style={{ color: theme.text }}>
              Score: {score.correct}/{score.total}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentWordIndex) / words.length) * 100}%` }}
            />
          </div>

          {/* Word Pronunciation */}
          <div className="text-center py-8">
            <div className="mb-6">
              <button
                className="btn-primary text-lg px-8 py-4"
                onClick={() => speakWord(currentWord.word)}
                disabled={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Playing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-3" />
                    🔊 Listen to the word
                  </>
                )}
              </button>
            </div>

            {/* Input Area */}
            <div className="max-w-md mx-auto">
              <label 
                className="block text-lg font-medium mb-4"
                style={{ 
                  color: theme.text,
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily
                }}
              >
                Type the word you heard:
              </label>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: feedback.includes('Great job') ? '#10b981' : 
                              feedback.includes('Not quite') ? '#ef4444' : theme.border,
                  color: theme.text,
                  fontSize: `${fontSize + 2}px`,
                  fontFamily: fontFamily
                }}
                placeholder="Type here..."
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {/* Feedback */}
            {feedback && (
              <div 
                className={`mt-4 p-4 rounded-lg ${
                  feedback.includes('Great job') 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily
                }}
              >
                {feedback}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                className="btn-secondary"
                onClick={() => speakWord(currentWord.word)}
                disabled={isPlaying}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Repeat
              </button>
              
              <button
                className="btn-primary"
                onClick={checkSpelling}
                disabled={!userInput.trim() || feedback !== ''}
              >
                <Check className="w-4 h-4 mr-2" />
                Check Spelling
              </button>
              
              <button
                className="btn-tertiary"
                onClick={skipWord}
                disabled={feedback !== ''}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Skip
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Results Screen */
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>
            Spelling Quiz Complete! 🎉
          </h3>
          <div className="text-4xl font-bold mb-4" style={{ color: theme.accent }}>
            {score.correct} / {score.total}
          </div>
          <p className="text-lg mb-2" style={{ color: theme.text }}>
            You got {Math.round((score.correct / score.total) * 100)}% correct!
          </p>
          <p className="text-base mb-6" style={{ color: theme.text }}>
            {score.correct === score.total 
              ? "Perfect score! You're a spelling champion! 🏆" 
              : score.correct >= score.total * 0.8 
              ? "Great job! Keep practicing to improve even more! 💪"
              : "Good effort! Practice makes perfect! 📚"}
          </p>
          <button
            className="btn-primary"
            onClick={resetQuiz}
          >
            <Type className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// Quiz Component
const QuizSection = ({ questions, theme, fontSize, lineHeight, fontFamily }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [questionFeedback, setQuestionFeedback] = useState({})
  const [submittedAnswers, setSubmittedAnswers] = useState({})

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  const submitAnswer = (questionIndex) => {
    const selectedAnswer = selectedAnswers[questionIndex]
    const isCorrect = selectedAnswer === questions[questionIndex].correct
    
    setSubmittedAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }))
    
    setQuestionFeedback(prev => ({
      ...prev,
      [questionIndex]: {
        isCorrect,
        message: isCorrect 
          ? "Correct! Well done! 🎉" 
          : `Incorrect. The correct answer is: ${questions[questionIndex].options[questions[questionIndex].correct]}`
      }
    }))
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++
      }
    })
    return correct
  }

  const resetQuiz = () => {
    setSelectedAnswers({})
    setShowResults(false)
    setCurrentQuestion(0)
    setQuestionFeedback({})
    setSubmittedAnswers({})
  }

  if (questions.length === 0) return null

  return (
    <div className="space-y-4">
      {!showResults ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: theme.text }}>
                Progress: {Object.keys(submittedAnswers).length}/{questions.length}
              </span>
              <div className="flex space-x-2">
                <button
                  className="btn-tertiary"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                <button
                  className="btn-tertiary"
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(submittedAnswers).length / questions.length) * 100}%` }}
            />
          </div>

          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              fontFamily: fontFamily
            }}
          >
            <h4 className="font-semibold mb-4">{questions[currentQuestion].question}</h4>
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion] === index
                const isSubmitted = submittedAnswers.hasOwnProperty(currentQuestion)
                const isCorrectAnswer = index === questions[currentQuestion].correct
                const wasSelectedWrong = isSubmitted && isSelected && !isCorrectAnswer
                
                return (
                  <label 
                    key={index} 
                    className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${
                      isSubmitted 
                        ? isCorrectAnswer 
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : wasSelectedWrong
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-gray-50 border-gray-200'
                        : isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    style={{
                      backgroundColor: isSubmitted 
                        ? isCorrectAnswer ? '#f0fdf4' 
                        : wasSelectedWrong ? '#fef2f2'
                        : theme.cardBg
                        : isSelected ? '#eff6ff' : theme.cardBg,
                      borderColor: theme.border
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={isSelected}
                      onChange={() => !isSubmitted && handleAnswerSelect(currentQuestion, index)}
                      disabled={isSubmitted}
                      className="text-blue-600"
                    />
                    <span className="flex-1">{option}</span>
                    {isSubmitted && isCorrectAnswer && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                    {isSubmitted && wasSelectedWrong && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </label>
                )
              })}
            </div>

            {/* Immediate Feedback */}
            {questionFeedback[currentQuestion] && (
              <div 
                className={`mt-4 p-4 rounded-lg border ${
                  questionFeedback[currentQuestion].isCorrect
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
              >
                {questionFeedback[currentQuestion].message}
              </div>
            )}

            {/* Submit Answer Button */}
            {selectedAnswers[currentQuestion] !== undefined && !submittedAnswers.hasOwnProperty(currentQuestion) && (
              <div className="mt-4 text-center">
                <button
                  className="btn-primary"
                  onClick={() => submitAnswer(currentQuestion)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Submit Answer
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              className="btn-secondary"
              onClick={resetQuiz}
            >
              Reset Quiz
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={Object.keys(submittedAnswers).length !== questions.length}
            >
              Complete Quiz
            </button>
          </div>
        </>
      ) : (
        <div 
          className="text-center p-6 rounded-lg border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border
          }}
        >
          <h4 className="text-xl font-semibold mb-4">Quiz Results</h4>
          <div className="text-3xl font-bold mb-4 text-blue-600">
            {calculateScore()} / {questions.length}
          </div>
          <p className="text-gray-600 mb-4">
            You got {Math.round((calculateScore() / questions.length) * 100)}% correct!
          </p>
          <button
            className="btn-primary"
            onClick={resetQuiz}
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  )
}

// Main App Component
function App() {
  // State management
  const [currentStep, setCurrentStep] = useState(1)
  const [colorTheme, setColorTheme] = useState('default')
  const [fontFamily, setFontFamily] = useState("'OpenDyslexic', 'Inter', Arial, sans-serif") // Default to dyslexia-friendly font
  const [fontSize, setFontSize] = useState(16) // Minimum 16px for dyslexia accessibility
  const [lineHeight, setLineHeight] = useState(1.6)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showReadingPreferences, setShowReadingPreferences] = useState(false)
  
  // Content state
  const [extractedText, setExtractedText] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [spellingQuiz, setSpellingQuiz] = useState([])
  const [currentSource, setCurrentSource] = useState('') // 'upload' or 'paste'
  
  // UI state for showing sections
  const [showSummary, setShowSummary] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showSpellingQuiz, setShowSpellingQuiz] = useState(false)
  
  // Accessibility features
  const [focusMode, setFocusMode] = useState(false)
  const [distractionFreeMode, setDistractionFreeMode] = useState(false)
  const [readingRulerPosition, setReadingRulerPosition] = useState(0)
  const [highlightedTextRange, setHighlightedTextRange] = useState(null)
  const [selectedWord, setSelectedWord] = useState(null)
  const [wordPosition, setWordPosition] = useState(null)
  
  // Processing state
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingContent, setSpeakingContent] = useState('')

  const theme = colorThemes[colorTheme]
  const currentText = currentSource === 'paste' ? pastedText : extractedText

  // File upload handler
  const handleFileUpload = async (files) => {
    const file = files[0]
    if (!file) return

    if (!ocrService.isSupportedFile(file)) {
      setOcrError(`Unsupported file type: ${file.type}`)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setOcrError(`File too large: ${ocrService.formatFileSize(file.size)}. Maximum size is 10MB.`)
      return
    }

    setIsProcessingOCR(true)
    setOcrError('')
    setCurrentStep(2)
    setCurrentSource('upload')

    try {
      const text = await ocrService.extractText(file, setOcrProgress)
      setExtractedText(text)
      setCurrentStep(3)
    } catch (error) {
      setOcrError(error.message)
      setCurrentStep(1)
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(0)
    }
  }

  // Text paste handler
  const handleTextPaste = (text) => {
    if (!text || text.trim().length === 0) return
    
    setPastedText(text.trim())
    setCurrentSource('paste')
    setCurrentStep(3)
    setOcrError('')
  }

  // AI Summary generation
  const generateSummary = async () => {
    if (!currentText) return
    
    setIsGenerating(true)
    setShowSummary(true)
    try {
      const summary = await geminiService.generateSummary(currentText)
      setAiSummary(summary.join('\n\n'))
      setCurrentStep(4)
          } catch (error) {
        console.error('Failed to generate summary:', error)
        // Fallback summary
        setAiSummary('• The water cycle describes continuous water movement on Earth\n• Four main stages: evaporation, condensation, precipitation, collection\n• Essential for all life and helps distribute heat globally\n\n📝 Note: This is demo content. For AI-generated summaries, set up your Gemini API key.')
      } finally {
        setIsGenerating(false)
      }
  }

  // Quiz generation
  const generateQuiz = async () => {
    if (!currentText) return
    
    setIsGeneratingQuiz(true)
    setShowQuiz(true)
    try {
      const questions = await geminiService.generateQuestions(currentText)
      setQuizQuestions(questions)
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      // Use demo questions as fallback
      setQuizQuestions(geminiService.getDemoQuestions())
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  // Spelling Quiz generation
  const generateSpellingQuiz = () => {
    if (!currentText) return
    
    setShowSpellingQuiz(true)
    // Generate spelling words from the current text
    const words = currentText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= 4 && word.length <= 10)
      .slice(0, 10) // Take first 10 suitable words
      
    setSpellingQuiz(words.map(word => ({
      word: word,
      attempts: 0,
      completed: false
    })))
  }

  // Word definition handler
  const handleWordClick = (word, position) => {
    setSelectedWord(word)
    setWordPosition(position)
  }

  const closeWordDefinition = () => {
    setSelectedWord(null)
    setWordPosition(null)
  }

  // Text-to-speech handler with highlighting
  const handleSpeak = (content, contentType) => {
    if (isSpeaking && speakingContent === contentType) {
      // Stop speaking
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakingContent('')
      setHighlightedTextRange(null)
    } else {
      // Start speaking with visual synchronization
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Split content into sentences for highlighting
      const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [content]
      let currentSentence = 0
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setSpeakingContent(contentType)
        
        // Highlight text as it's being read
        const highlightInterval = setInterval(() => {
          if (currentSentence < sentences.length) {
            setHighlightedTextRange({
              start: sentences.slice(0, currentSentence).join('').length,
              end: sentences.slice(0, currentSentence + 1).join('').length,
              sentence: sentences[currentSentence]
            })
            currentSentence++
          } else {
            clearInterval(highlightInterval)
          }
        }, (utterance.rate * 3000)) // Adjust timing based on speech rate
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setSpeakingContent('')
        setHighlightedTextRange(null)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        setSpeakingContent('')
        setHighlightedTextRange(null)
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Apply global font settings to entire webpage
  useEffect(() => {
    // Apply font settings to the document body for global effect
    const body = document.body
    const root = document.documentElement
    
    // Apply font settings globally
    body.style.fontFamily = fontFamily
    body.style.fontSize = `${fontSize}px`
    body.style.lineHeight = lineHeight.toString()
    
    // Also apply to root element for better inheritance
    root.style.setProperty('--global-font-family', fontFamily)
    root.style.setProperty('--global-font-size', `${fontSize}px`)
    root.style.setProperty('--global-line-height', lineHeight.toString())
    
    // Apply theme colors globally
    root.style.setProperty('--theme-bg', theme.bg)
    root.style.setProperty('--theme-text', theme.text)
    root.style.setProperty('--theme-border', theme.border)
    root.style.setProperty('--theme-card-bg', theme.cardBg)
    root.style.setProperty('--theme-accent', theme.accent)
    
    // Cleanup function to reset styles if component unmounts
    return () => {
      body.style.fontFamily = ''
      body.style.fontSize = ''
      body.style.lineHeight = ''
    }
  }, [fontFamily, fontSize, lineHeight, theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'u':
            event.preventDefault()
            document.querySelector('input[type="file"]')?.click()
            break
          case 's':
            event.preventDefault()
            if (currentText) generateSummary()
            break
          case 't':
            event.preventDefault()
            if (currentText) handleSpeak(currentText, 'text')
            break
          case 'q':
            event.preventDefault()
            if (currentText) generateQuiz()
            break
          case 'f':
            event.preventDefault()
            setFocusMode(!focusMode)
            break
          case 'd':
            event.preventDefault()
            setDistractionFreeMode(!distractionFreeMode)
            break
          case 'Escape':
            event.preventDefault()
            closeWordDefinition()
            setFocusMode(false)
            break
          default:
            break
         }
       }
    }

         window.addEventListener('keydown', handleKeyDown)
     return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentText])

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: theme.bg,
        color: theme.text
      }}
    >
      {/* Skip Links for Screen Readers */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-blue-600 text-white px-4 py-2 rounded-md"
        style={{ backgroundColor: theme.accent }}
      >
        Skip to main content
      </a>

      {/* Live Region for Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        id="status-announcements"
      >
        {isProcessingOCR && `Processing document, ${ocrProgress}% complete`}
        {isGenerating && 'Generating AI summary'}
        {isGeneratingQuiz && 'Generating quiz questions'}
        {isSpeaking && `Reading ${speakingContent} aloud`}
        {ocrError && `Error: ${ocrError}`}
      </div>
      {/* Header */}
      <header 
        className="header-container transition-colors duration-200"
        style={{
          backgroundColor: theme.cardBg,
          borderBottomColor: theme.border,
          color: theme.text
        }}
        role="banner"
        aria-label="EchoLearn application header"
      >
        {/* Desktop Header Layout (768px+) */}
        <div className="header-content hidden md:flex">
          <div className="flex items-center space-x-4">
            {/* EchoLearn Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h1 className="logo">EchoLearn</h1>
            </div>
            <p className="subtitle hidden lg:block">
              Transform documents into dyslexia-friendly study materials
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="keyboard-btn"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Shortcuts</span>
            </button>
            <button
              className="keyboard-btn"
              onClick={() => setShowReadingPreferences(!showReadingPreferences)}
              title="Reading Preferences"
              aria-label="Open reading preferences"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Layout (<768px) */}
        <div className="flex md:hidden items-center justify-between w-full px-4 py-3">
          {/* Left: Shortcut Keys Button */}
          <div className="flex-1 flex justify-start">
            <button
              className="keyboard-btn text-sm"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
              <span>Shortcut Keys</span>
            </button>
          </div>

          {/* Center: EchoLearn Logo */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold" style={{ color: theme.accent }}>EchoLearn</h1>
            </div>
          </div>

          {/* Right: Settings Icon */}
          <div className="flex-1 flex justify-end">
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowReadingPreferences(!showReadingPreferences)}
              title="Reading Preferences"
              aria-label="Open reading preferences"
              style={{ backgroundColor: 'transparent' }}
            >
              <Settings className="w-5 h-5" style={{ color: theme.accent }} />
            </button>
          </div>
        </div>
      </header>

            {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        theme={theme}
      />

      {/* Reading Preferences Modal */}
      <ReadingPreferencesModal
        isOpen={showReadingPreferences}
        onClose={() => setShowReadingPreferences(false)}
        theme={theme}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        colorTheme={colorTheme}
        setColorTheme={setColorTheme}
        colorThemes={colorThemes}
      />

      {/* Progress Steps */}
              <ProgressSteps currentStep={currentStep} theme={theme} />

      {/* Main Content */}
      <main 
        id="main-content"
        className="main-container"
        role="main"
        aria-label="Main content area"
      >
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Upload Section */}
          <section 
            className="card transition-colors duration-200"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              color: theme.text
            }}
            aria-labelledby="upload-heading"
            role="region"
          >
            <div className="card-header">
              <Upload className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h2 id="upload-heading" className="card-title">Upload Documents or Paste Text Here</h2>
            </div>
            
            <UploadZone
              onFileUpload={handleFileUpload}
              isProcessing={isProcessingOCR}
              progress={ocrProgress}
              error={ocrError}
              theme={theme}
            />

            {/* Text Paste Area */}
            <div className="paste-section">
              <div className="paste-label">
                <FilePlus className="w-4 h-4 text-gray-600" />
                <span>Or paste text here:</span>
              </div>
              <textarea
                className="paste-textarea"
                placeholder="Paste your text here..."
                onChange={(e) => handleTextPaste(e.target.value)}
              />
            </div>

            {/* Action Buttons - Show based on content source */}
            {currentText && (
              <div className="action-buttons mt-6 p-4 border-t" style={{ borderColor: theme.border }}>
                <h3 className="font-semibold mb-4" style={{ color: theme.text }}>
                  {currentSource === 'paste' ? 'Text Processing Options' : 'Document Processing Options'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    className="btn-primary"
                    onClick={generateSummary} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate AI Summary
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn-primary"
                    onClick={generateQuiz} 
                    disabled={isGeneratingQuiz}
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Type className="w-4 h-4 mr-2" />
                        Generate Practice Quiz
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn-primary"
                    onClick={generateSpellingQuiz}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Generate Spelling Quiz
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Extracted Text Display */}
          {currentText && (
            <section 
              className="card transition-colors duration-200"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text
              }}
              aria-labelledby="text-display-heading"
              role="region"
            >
              <div className="card-header">
                <FileText className="w-5 h-5 text-primary-600" aria-hidden="true" />
                <h3 id="text-display-heading" className="card-title">{currentSource === 'paste' ? 'Pasted Text' : 'Extracted Text'}</h3>
                <div className="text-controls ml-auto">
                  <button 
                    className={`btn-tertiary ${focusMode ? 'bg-blue-100 text-blue-700' : ''}`}
                    onClick={() => setFocusMode(!focusMode)}
                    aria-label="Toggle reading focus mode"
                    title="Reading Focus Tool"
                  >
                    <Focus className="w-4 h-4" />
                  </button>
                  <button 
                    className={`btn-tertiary ${distractionFreeMode ? 'bg-green-100 text-green-700' : ''}`}
                    onClick={() => setDistractionFreeMode(!distractionFreeMode)}
                    aria-label="Toggle distraction-free mode"
                    title="Distraction-Free Mode"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button 
                    className="btn-tertiary"
                    aria-label="Word definitions available - click on words"
                    title="Click words for definitions"
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>
                  <button 
                    className={`btn-tertiary ${isSpeaking && speakingContent === 'text' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}`}
                    onClick={() => handleSpeak(currentText, 'text')}
                    aria-label={isSpeaking && speakingContent === 'text' ? 'Stop reading aloud' : 'Read text aloud'}
                  >
                    {isSpeaking && speakingContent === 'text' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <EnhancedTextDisplay
                text={currentText}
                theme={theme}
                fontSize={fontSize}
                lineHeight={lineHeight}
                fontFamily={fontFamily}
                focusMode={focusMode}
                onWordClick={handleWordClick}
                highlightRange={speakingContent === 'text' ? highlightedTextRange : null}
              />
            </section>
          )}

          {/* AI Summary Section */}
          {showSummary && (
            <div 
              className="card transition-colors duration-200"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              <div className="card-header">
                <Brain className="w-5 h-5 text-primary-600" />
                <h3 className="card-title">AI Summary</h3>
                <div className="text-controls ml-auto">
                  <button className="btn-tertiary">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="btn-tertiary">
                    <Type className="w-4 h-4" />
                  </button>
                  <button 
                    className={`btn-tertiary ${isSpeaking && speakingContent === 'summary' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}`}
                    onClick={() => aiSummary && handleSpeak(aiSummary, 'summary')}
                  >
                    {isSpeaking && speakingContent === 'summary' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!aiSummary ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating AI Summary...</p>
                </div>
              ) : (
                <EnhancedTextDisplay
                  text={aiSummary}
                  theme={theme}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  fontFamily={fontFamily}
                  focusMode={false}
                  onWordClick={handleWordClick}
                  highlightRange={speakingContent === 'summary' ? highlightedTextRange : null}
                />
              )}
                        </div>
          )}

          {/* Quiz Section */}
          {showQuiz && (
            <div 
              className="card transition-colors duration-200"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              <div className="card-header">
                <Type className="w-5 h-5 text-primary-600" />
                <h3 className="card-title">Practice Quiz</h3>
                <div className="text-controls ml-auto">
                  <button className="btn-tertiary">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="btn-tertiary">
                    <Type className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {quizQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <Type className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating Practice Quiz...</p>
                </div>
              ) : (
                <QuizSection 
                  questions={quizQuestions}
                  theme={theme}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  fontFamily={fontFamily}
                />
              )}
            </div>
          )}

          {/* Spelling Quiz Section */}
          {showSpellingQuiz && (
            <div 
              className="card transition-colors duration-200"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              <div className="card-header">
                <Volume2 className="w-5 h-5 text-primary-600" />
                <h3 className="card-title">Spelling Practice</h3>
                <div className="text-controls ml-auto">
                  <button className="btn-tertiary">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="btn-tertiary">
                    <Type className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <SpellingQuizSection 
                words={spellingQuiz}
                theme={theme}
                fontSize={fontSize}
                lineHeight={lineHeight}
                fontFamily={fontFamily}
              />
            </div>
          )}
                        </div>
                        
        {/* Sidebar - Hidden in distraction-free mode */}
        {!distractionFreeMode && (
          <div className="sidebar">


          {/* Help Section */}
          <div 
            className="card transition-colors duration-200"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <div className="card-header">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <h3 className="card-title">Features</h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div>📋 Upload images & PDFs for text extraction</div>
              <div>🧠 AI-powered summaries & quizzes</div>
              <div>🔊 Text-to-speech functionality</div>
              <div>♿ Dyslexia-friendly reading options</div>
              <div>⌨️ Full keyboard navigation support</div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Word Definition Popup */}
      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord}
          position={wordPosition}
          onClose={closeWordDefinition}
          theme={theme}
        />
      )}

      {/* Distraction-Free Mode Indicator */}
      {distractionFreeMode && (
        <div 
          className="fixed top-4 right-4 z-40 p-2 rounded-lg border shadow-lg"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
            color: theme.text
          }}
        >
          <div className="flex items-center space-x-2">
            <Accessibility className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="text-sm font-medium">Distraction-Free Mode</span>
            <button
              className="btn-tertiary text-xs"
              onClick={() => setDistractionFreeMode(false)}
              aria-label="Exit distraction-free mode"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App 