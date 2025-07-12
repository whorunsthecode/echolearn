import React, { useState, useRef, useEffect } from 'react'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'
import { Mic, MicOff, Upload, Play, Pause, Download, Copy, FileText, Brain, HelpCircle, Globe, Volume2, VolumeX, ArrowRight, Focus, Eye, EyeOff, Keyboard, FileImage, FilePlus, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import geminiService from './services/geminiService.js'
import speechService from './services/speechService.js'
import ocrService from './services/ocrService.js'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          backgroundColor: '#fee', 
          color: '#c53030',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <AlertCircle size={48} style={{ marginBottom: '16px' }} />
          <h2>Something went wrong</h2>
          <p>The OCR component encountered an error. Please refresh the page and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#c53030',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Refresh Page
          </button>
          <details style={{ marginTop: '16px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', marginTop: '8px' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Global styles for dyslexia-friendly design
const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'OpenDyslexic';
    src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2'),
         url('/fonts/OpenDyslexic-Regular.woff') format('woff'),
         url('/fonts/OpenDyslexic-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'OpenDyslexic';
    src: url('/fonts/OpenDyslexic-Bold.woff2') format('woff2'),
         url('/fonts/OpenDyslexic-Bold.woff') format('woff'),
         url('/fonts/OpenDyslexic-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.fontFamily};
    font-size: ${props => props.theme.fontSize}px;
    line-height: ${props => props.theme.lineHeight};
    letter-spacing: ${props => props.theme.letterSpacing}px;
    word-spacing: ${props => props.theme.wordSpacing}em;
    background-color: ${props => props.theme.backgroundColor};
    color: ${props => props.theme.textColor};
    transition: all 0.3s ease;
  }
`

// Dyslexia-friendly color schemes
const colorSchemes = {
  light: {
    name: 'Light (Default)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 0.16,
    backgroundColor: '#fafafa',
    textColor: '#2c3e50',
    cardBackground: '#ffffff',
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71',
    borderColor: '#e1e8ed',
    buttonHover: '#2980b9'
  },
  cream: {
    name: 'Cream (Easy on Eyes)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 0.16,
    backgroundColor: '#f7f5f3',
    textColor: '#4a4a4a',
    cardBackground: '#fefcf9',
    primaryColor: '#8b6914',
    secondaryColor: '#6b8e23',
    borderColor: '#e8e2d5',
    buttonHover: '#704214'
  },
  blue: {
    name: 'Blue Tint (Reduces Glare)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 0.16,
    backgroundColor: '#f0f8ff',
    textColor: '#2c3e50',
    cardBackground: '#fafeff',
    primaryColor: '#1e6091',
    secondaryColor: '#2e8b57',
    borderColor: '#d6e9f0',
    buttonHover: '#164a6b'
  },
  yellow: {
    name: 'Yellow Paper (Classic)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 0.16,
    backgroundColor: '#fffacd',
    textColor: '#333333',
    cardBackground: '#ffffe0',
    primaryColor: '#b8860b',
    secondaryColor: '#228b22',
    borderColor: '#f0e68c',
    buttonHover: '#996515'
  },
  dark: {
    name: 'Dark (High Contrast)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.5,
    wordSpacing: 0.16,
    backgroundColor: '#2c3e50',
    textColor: '#ecf0f1',
    cardBackground: '#34495e',
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71',
    borderColor: '#4a5f7a',
    buttonHover: '#2980b9'
  }
}

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.backgroundColor};
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: ${props => Math.max(props.theme.fontSize + 16, 28)}px;
    color: ${props => props.theme.primaryColor};
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  p {
    color: ${props => props.theme.textColor};
    opacity: 0.8;
    font-size: ${props => props.theme.fontSize + 2}px;
  }
`

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  padding: 20px;
  background: ${props => props.theme.cardBackground};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.borderColor};
  
  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    
    &.active {
      background: ${props => props.theme.primaryColor};
      color: white;
    }
    
    &.completed {
      background: ${props => props.theme.secondaryColor};
      color: white;
    }
    
    &.pending {
      background: ${props => props.theme.backgroundColor};
      color: ${props => props.theme.textColor};
      border: 1px solid ${props => props.theme.borderColor};
    }
  }
  
  .arrow {
    color: ${props => props.theme.primaryColor};
    background: ${props => props.theme.backgroundColor};
    padding: 8px;
    border-radius: 50%;
    border: 1px solid ${props => props.theme.borderColor};
  }
`

const WordDefinitionPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${props => props.theme.cardBackground};
  border: 2px solid ${props => props.theme.primaryColor};
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  
  .word-title {
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.theme.primaryColor};
    margin-bottom: 10px;
  }
  
  .definition {
    color: ${props => props.theme.textColor};
    line-height: 1.6;
  }
`

const InlineHelp = styled.div`
  background: ${props => props.theme.backgroundColor};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: ${props => props.theme.textColor};
  opacity: 0.8;
  
  .help-icon {
    display: inline-block;
    margin-right: 8px;
    color: ${props => props.theme.primaryColor};
  }
`

const ReadingControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: ${props => props.theme.backgroundColor};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.borderColor};
  
  .control-label {
    font-size: 14px;
    color: ${props => props.theme.textColor};
    margin-right: 8px;
  }
`

const FileUploadZone = styled.div`
  border: 2px dashed ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.theme.backgroundColor};
  
  &:hover {
    border-color: ${props => props.theme.primaryColor};
    background: ${props => props.theme.cardBackground};
  }
  
  &.drag-active {
    border-color: ${props => props.theme.primaryColor};
    background: ${props => props.theme.cardBackground};
    transform: scale(1.02);
  }
  
  .upload-icon {
    font-size: 48px;
    color: ${props => props.theme.primaryColor};
    margin-bottom: 16px;
  }
  
  .upload-text {
    font-size: 18px;
    color: ${props => props.theme.textColor};
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .upload-subtext {
    font-size: 14px;
    color: ${props => props.theme.textColor};
    opacity: 0.7;
  }
`

const ProgressContainer = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: ${props => props.theme.cardBackground};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.borderColor};
  
  .progress-label {
    font-size: 14px;
    color: ${props => props.theme.textColor};
    margin-bottom: 8px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: ${props => props.theme.backgroundColor};
    border-radius: 4px;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: ${props => props.theme.primaryColor};
      transition: width 0.3s ease;
    }
  }
`

const ErrorMessage = styled.div`
  background: #fee;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  border: 1px solid #feb2b2;
`

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme.backgroundColor};
  border-radius: 8px;
  margin-top: 16px;
  border: 1px solid ${props => props.theme.borderColor};
  
  .file-icon {
    color: ${props => props.theme.primaryColor};
  }
  
  .file-details {
    flex: 1;
    
    .file-name {
      font-weight: 500;
      color: ${props => props.theme.textColor};
    }
    
    .file-size {
      font-size: 12px;
      color: ${props => props.theme.textColor};
      opacity: 0.7;
    }
  }
`

/* 
 * Status Badge Component - NOT a button!
 * 
 * Used for displaying system status information.
 * Uses soft, non-action colors to avoid confusion with interactive elements.
 * Pill-shaped design clearly indicates this is informational, not clickable.
 * 
 * Status types:
 *   - connected: Soft green background for positive status
 *   - demo: Soft amber background for informational status
 *   - disconnected: Soft amber background for warning status
 */
const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  
  /* Connected Status */
  ${props => props.$status === 'connected' && `
    background: #d1fae5;
    color: #166534;
    border: 1px solid #a7f3d0;
  `}
  
  /* Disconnected Status */
  ${props => props.$status === 'disconnected' && `
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  `}
  
  /* Demo Mode Status */
  ${props => props.$status === 'demo' && `
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  `}
  
  /* Checking Status */
  ${props => props.$status === 'checking' && `
    background: #e0e7ff;
    color: #3730a3;
    border: 1px solid #c7d2fe;
  `}
  
  .status-icon {
    font-size: 16px;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Card = styled.div`
  background: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.borderColor};
`

const AudioControls = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
  margin-bottom: 2rem;
  
  /* Ensure consistent spacing for mobile */
  @media (max-width: 768px) {
    gap: 1rem;
    flex-direction: column;
    
    > * {
      width: 100%;
      max-width: 300px;
    }
  }
`

/* 
 * Button Hierarchy for EchoLearn - WCAG AA Compliant
 * 
 * PRIMARY (variant="primary"):
 *   - Deep blue (#2563eb) solid background
 *   - Used for main workflow actions (Start Recording, Upload Audio)
 *   - Maximum visual prominence with shadow
 * 
 * SECONDARY (variant="secondary"):
 *   - Blue outlined (#2563eb) with transparent background
 *   - Used for supporting actions (Generate Summary, Read Aloud)
 *   - Clear but less prominent than primary
 * 
 * TERTIARY (variant="tertiary"):
 *   - Grey outlined (#6b7280) minimal styling
 *   - Used for utility actions (Copy Text, minor controls)
 *   - Least visual weight, doesn't compete with main actions
 */
const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: ${props => props.theme.fontSize}px;
  font-family: ${props => props.theme.fontFamily};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  line-height: 1.2;
  
  /* Primary Button Styles */
  ${props => props.$variant === 'primary' && `
    background: #2563eb;
    color: white;
    border: none;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    min-width: 200px;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    
    &:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    }
    
    &:focus {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
    }
    
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      
      &:hover {
        background: #9ca3af;
        transform: none;
        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
      }
    }
  `}
  
  /* Secondary Button Styles */
  ${props => props.$variant === 'secondary' && `
    background: #e3eafc;
    color: #2563eb;
    border: 2px solid #2563eb;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 500;
    
    &:hover {
      background: #2563eb;
      border-color: #2563eb;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    }
    
    &:focus {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
      background: #2563eb;
      border-color: #2563eb;
      color: white;
    }
  `}
  
  /* Tertiary Button Styles */
  ${props => props.$variant === 'tertiary' && `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    padding: 8px 16px;
    font-size: ${props.theme.fontSize - 2}px;
    
    &:hover {
      background: #374151;
      border-color: #374151;
      color: white;
    }
    
    &:focus {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
    }
  `}
  
  /* Default to secondary if no variant specified */
  ${props => !props.$variant && `
    background: #e3eafc;
    color: #2563eb;
    border: 2px solid #2563eb;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 500;
    
    &:hover {
      background: #2563eb;
      border-color: #2563eb;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
    }
    
    &:focus {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
      background: #2563eb;
      border-color: #2563eb;
      color: white;
    }
  `}
  
  /* Ensure consistent width for primary buttons in button groups */
  ${props => props.$variant === 'primary' && props.$fullWidth && `
    min-width: 160px;
    flex: 1;
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: #9ca3af !important;
    border-color: #9ca3af !important;
    color: white !important;
    
    &:hover {
      transform: none;
      box-shadow: none;
      background: #9ca3af !important;
      border-color: #9ca3af !important;
    }
  }
`

const TextDisplay = styled.div`
  background: ${props => props.theme.cardBackground};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 8px;
  padding: 20px;
  min-height: 200px;
  font-family: ${props => props.$fontFamily || props.theme.fontFamily};
  font-size: ${props => props.$fontSize || props.theme.fontSize}px;
  line-height: ${props => props.$lineHeight || props.theme.lineHeight};
  overflow-y: auto;
  max-height: 400px;
  
  /* Dyslexia-friendly text formatting */
  max-width: ${props => Math.max(45, Math.min(65, Math.floor((props.$fontSize || props.theme.fontSize) * 3.5)))}ch;
  text-align: left;
  hyphens: none;
  word-break: normal;
  
  /* Improved paragraph spacing */
  p {
    margin-bottom: 1.2em;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Sentence spacing for better readability */
  .sentence {
    display: block;
    margin-bottom: 0.4em;
    padding: 0.2em 0;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: ${props => props.theme.backgroundColor};
      border-radius: 4px;
      padding: 0.2em 0.4em;
    }
    
    &.focused {
      background-color: ${props => props.theme.primaryColor};
      color: white;
      border-radius: 4px;
      padding: 0.2em 0.4em;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  }
  
  .word {
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: ${props => props.theme.primaryColor};
      color: white;
      border-radius: 2px;
      padding: 0 2px;
    }
  }
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ControlGroup = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: ${props => props.theme.textColor};
  }
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 6px;
  background: ${props => props.theme.cardBackground};
  color: ${props => props.theme.textColor};
  font-size: ${props => props.theme.fontSize}px;
  
  &:focus {
    outline: 3px solid ${props => props.theme.primaryColor};
    outline-offset: 2px;
    border-color: ${props => props.theme.primaryColor};
  }
`

const Slider = styled.input`
  width: 100%;
  margin: 8px 0;
`

const Toggle = styled.button`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 6px;
  background: ${props => props.active ? props.theme.primaryColor : props.theme.cardBackground};
  color: ${props => props.active ? 'white' : props.theme.textColor};
  cursor: pointer;
  transition: all 0.3s ease;
`

const SummarySection = styled.div`
  margin-top: 20px;
  
  ul {
    list-style: none;
    padding-left: 0;
    
    li {
      padding: 8px 0;
      border-bottom: 1px solid ${props => props.theme.borderColor};
      
      &:before {
        content: "• ";
        color: ${props => props.theme.primaryColor};
        font-weight: bold;
        margin-right: 8px;
      }
    }
  }
`

const QuizSection = styled.div`
  margin-top: 20px;
`

const QuizProgress = styled.div`
  text-align: center;
  padding: 16px;
  background: ${props => props.theme.primaryColor};
  color: white;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
`

const QuestionCard = styled.div`
  background: #faf8f5; /* Soft cream background */
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px; /* Generous spacing between questions */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      color: #2c3e50;
      font-size: 20px;
      margin: 0;
    }
    

  }
  
  .question-text {
    color: #2c3e50;
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 24px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    border-left: 4px solid ${props => props.theme.primaryColor};
  }
`

const AnswerButton = styled.button`
  display: block;
  width: 100%;
  margin: 12px 0; /* Generous spacing between options */
  padding: 16px 20px; /* Large, clickable area */
  text-align: left;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  line-height: 1.5;
  
  &:hover {
    border-color: ${props => props.theme.primaryColor};
    background: ${props => props.theme.primaryColor};
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:focus {
    outline: 3px solid ${props => props.theme.primaryColor};
    outline-offset: 2px;
    border-color: ${props => props.theme.primaryColor};
  }
  
  &.correct {
    background: #065f46; /* Dark green */
    color: white;
    border-color: #065f46;
    
    &:before {
      content: "✓ ";
      font-weight: bold;
      margin-right: 8px;
    }
  }
  
  &.incorrect {
    background: #991b1b; /* Dark red */
    color: white;
    border-color: #991b1b;
    
    &:before {
      content: "✗ ";
      font-weight: bold;
      margin-right: 8px;
    }
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`

const FeedbackSection = styled.div`
  margin-top: 24px; /* Generous spacing above feedback */
  padding: 20px;
  border-radius: 8px;
  background: #faf8f5; /* Cream background */
  border-left: 4px solid ${props => props.isCorrect ? '#065f46' : '#991b1b'};
  
  .feedback-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .feedback-icon {
      font-size: 24px;
      margin-right: 12px;
      color: ${props => props.isCorrect ? '#065f46' : '#991b1b'};
    }
    
    .feedback-label {
      font-size: 18px;
      font-weight: 600;
      color: ${props => props.isCorrect ? '#065f46' : '#991b1b'};
    }
  }
  
  .feedback-message {
    color: #2c3e50;
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  
  .feedback-explanation {
    color: #4b5563;
    font-size: 14px;
    line-height: 1.5;
    font-style: italic;
  }
`

const SpellingQuizContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const SpellingQuizModal = styled.div`
  background: ${props => props.theme.cardBackground};
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  
  .quiz-header {
    text-align: center;
    margin-bottom: 32px;
    
    h2 {
      color: ${props => props.theme.primaryColor};
      margin-bottom: 12px;
      font-size: 24px;
    }
    
    .progress {
      color: ${props => props.theme.textColor};
      font-size: 16px;
      opacity: 0.8;
    }
  }
  
  .word-section {
    text-align: center;
    margin-bottom: 32px;
    
    .instruction {
      font-size: 18px;
      color: ${props => props.theme.textColor};
      margin-bottom: 20px;
      font-weight: 500;
    }
    
    .audio-controls {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 24px;
    }
  }
  
  .input-section {
    margin-bottom: 32px;
    
    .input-label {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: ${props => props.theme.textColor};
      margin-bottom: 12px;
      text-align: left;
    }
    
    .spelling-input {
      width: 100%;
      padding: 16px 20px;
      font-size: 20px;
      font-family: ${props => props.theme.fontFamily};
      border: 2px solid ${props => props.theme.borderColor};
      border-radius: 8px;
      background: ${props => props.theme.backgroundColor};
      color: ${props => props.theme.textColor};
      text-align: center;
      
      &:focus {
        outline: none;
        border-color: ${props => props.theme.primaryColor};
        box-shadow: 0 0 0 3px ${props => props.theme.primaryColor}33;
      }
    }
  }
  
  .quiz-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  
  .close-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${props => props.theme.textColor};
    padding: 8px;
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.borderColor};
    }
  }
`

const SpellingFeedback = styled.div`
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  
  ${props => props.isCorrect ? `
    background: #d1fae5;
    color: #065f46;
    border: 2px solid #10b981;
  ` : `
    background: #fef2f2;
    color: #991b1b;
    border: 2px solid #ef4444;
  `}
  
  .feedback-text {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 16px;
  }
  
  .feedback-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
`

function App() {
  // State management
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparingRecording, setIsPreparingRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [summary, setSummary] = useState([])
  const [questions, setQuestions] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // OCR and file upload state
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [ocrError, setOcrError] = useState('')
  
  // Spelling Quiz state
  const [showSpellingQuiz, setShowSpellingQuiz] = useState(false)
  const [spellingWords, setSpellingWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userSpelling, setUserSpelling] = useState('')
  const [spellingFeedback, setSpellingFeedback] = useState('')
  const [spellingScore, setSpellingScore] = useState(0)
  const [showSpellingFeedback, setShowSpellingFeedback] = useState(false)
  const [speechInstance, setSpeechInstance] = useState(null)
  
  // Customization state
  const [colorScheme, setColorScheme] = useState('light')
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif')
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  
  // Progress tracking
  const [currentStep, setCurrentStep] = useState(1) // 1: Record, 2: Transcribe, 3: Study
  
  // Reading focus tool
  const [focusedSentenceIndex, setFocusedSentenceIndex] = useState(-1)
  const [isReadingMode, setIsReadingMode] = useState(false)
  
  // Dictionary/pronunciation
  const [selectedWord, setSelectedWord] = useState(null)
  const [wordDefinition, setWordDefinition] = useState('')
  
  // Track what is currently being read
  const [currentlyReading, setCurrentlyReading] = useState(null) // 'transcript', 'summary', or null
  
  // Paste text functionality
  const [pastedText, setPastedText] = useState('')
  const [textSource, setTextSource] = useState('upload') // 'upload' or 'paste'
  
  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
        const response = await fetch(`${apiUrl.replace('/api', '')}/api/health`)
        if (response.ok) {
          setBackendStatus('connected')
        } else {
          setBackendStatus('disconnected')
        }
      } catch (error) {
        console.error('Backend connection error:', error)
        setBackendStatus('disconnected')
      }
    }
    
    checkBackendStatus()
    
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Cleanup OCR service on component unmount
  useEffect(() => {
    return () => {
      ocrService.cleanup()
    }
  }, [])

  // Demo data for reliable demonstration
  const demoTranscript = `Welcome to today's lesson on the water cycle. The water cycle, also known as the hydrological cycle, describes the continuous movement of water on, above and below the surface of the Earth.

The water cycle consists of four main stages: evaporation, condensation, precipitation, and collection. During evaporation, heat from the sun causes water in oceans, lakes, and rivers to turn into water vapor that rises into the atmosphere.

Condensation occurs when this water vapor cools and forms tiny droplets around particles in the air, creating clouds. When these droplets become too heavy, they fall back to Earth as precipitation in the form of rain, snow, sleet, or hail.

Finally, the water collects in bodies of water and the cycle begins again. This process is essential for all life on Earth and helps distribute heat around our planet.`

  const demoSummary = [
    "The water cycle describes continuous water movement on Earth",
    "Four main stages: evaporation, condensation, precipitation, collection",
    "Evaporation: Sun heats water, turning it to vapor",
    "Condensation: Water vapor cools and forms clouds",
    "Precipitation: Water falls as rain, snow, sleet, or hail",
    "Collection: Water gathers in bodies of water, cycle repeats",
    "Essential for all life and helps distribute heat globally"
  ]

  const demoQuestions = [
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

  // Spelling Quiz words (generated from current text or predefined)
  const getSpellingWords = () => {
    const currentText = getCurrentText()
    if (currentText) {
      // Extract key words from the current text
      const words = currentText.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 4 && word.length < 12)
        .filter(word => !['the', 'and', 'that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'work'].includes(word))
        .slice(0, 10)
      
      return words.length > 0 ? words : getDefaultSpellingWords()
    }
    return getDefaultSpellingWords()
  }

  const getDefaultSpellingWords = () => [
    'water', 'cycle', 'cloud', 'vapor', 'ocean', 'river', 'earth', 'solar', 'heat', 'drop'
  ]

  // Audio recording functions
  const startRecording = async () => {
    try {
      setIsPreparingRecording(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Start real-time speech transcription
      speechService.startRealTimeTranscription(
        (transcriptData) => {
          // Update transcript in real-time
          setTranscript(transcriptData.complete)
        },
        (error) => {
          console.error('Speech recognition error:', error)
          // Fallback to demo on error
          setTranscript(demoTranscript)
        }
      )
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        
        // Stop speech recognition
        speechService.stopTranscription()
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setIsPreparingRecording(false)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
      setIsPreparingRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleFileUpload = async (files) => {
    const file = files[0]
    if (!file) return
    
    console.log('📁 File upload started:', file.name, file.type, ocrService.formatFileSize(file.size))
    
    // Reset previous states
    setOcrError('')
    setUploadedFile(file)
    setCurrentStep(2) // Move to transcribe step
    
    // Check if it's a supported file type
    if (!ocrService.isSupportedFile(file)) {
      const errorMsg = `Unsupported file type: ${file.type}. Please upload images (JPG, PNG, GIF, BMP, WebP) or PDFs.`
      console.error('❌ File type error:', errorMsg)
      setOcrError(errorMsg)
      setCurrentStep(1) // Reset to upload step
      return
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = `File too large: ${ocrService.formatFileSize(file.size)}. Maximum size is 10MB.`
      console.error('❌ File size error:', errorMsg)
      setOcrError(errorMsg)
      setCurrentStep(1) // Reset to upload step
      return
    }
    
    // Start processing
    setIsProcessingOCR(true)
    setOcrProgress(0)
    setTranscript('Initializing OCR...')
    
    try {
      console.log('🚀 Starting OCR processing...')
      
      const extractedText = await ocrService.extractText(file, (progress) => {
        console.log('📊 Progress update:', progress + '%')
        setOcrProgress(progress)
        setTranscript(`Extracting text... ${progress}%`)
      })
      
      console.log('📝 OCR completed, text length:', extractedText.length)
      
      if (extractedText && extractedText.length > 0) {
        setTranscript(extractedText)
        setTextSource('upload')
        setCurrentStep(3) // Move to study materials step
        console.log('✅ OCR completed successfully')
      } else {
        const errorMsg = 'No text found in the uploaded file. Please try a different image with clearer text.'
        console.warn('⚠️ Empty text result:', errorMsg)
        setOcrError(errorMsg)
        setTranscript('')
        setTextSource('upload')
        setCurrentStep(1) // Reset to upload step
      }
    } catch (error) {
      console.error('❌ OCR processing failed:', error)
      const errorMsg = error.message || 'Unknown error occurred during text extraction'
      setOcrError(errorMsg)
      setTranscript('')
      setTextSource('upload')
      setCurrentStep(1) // Reset to upload step
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(0)
    }
  }

  const handlePasteText = (text) => {
    console.log('📝 Processing pasted text...', text.length, 'characters')
    
    if (!text || text.trim().length === 0) {
      console.log('❌ No text provided')
      return
    }
    
    // Clean up the text
    const cleanText = text.trim()
    
    // Clear any existing OCR data
    setUploadedFile(null)
    setOcrError('')
    setIsProcessingOCR(false)
    setOcrProgress(0)
    
    // Set the pasted text as the current text
    setPastedText(cleanText)
    setTextSource('paste')
    setCurrentStep(3)
    
    // Clear previous AI results
    setSummary([])
    setQuestions([])
    
    console.log('✅ Pasted text processed successfully')
  }

  // Helper function to get current text (from upload or paste)
  const getCurrentText = () => {
    return textSource === 'paste' ? pastedText : transcript
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const generateSummary = async () => {
    const currentText = getCurrentText()
    console.log('🎯 Starting summary generation...')
    console.log('📝 Current text:', currentText.substring(0, 100) + '...')
    
    setIsGenerating(true)
    try {
      const summaryPoints = await geminiService.generateSummary(currentText)
      setSummary(summaryPoints)
      console.log('✅ Summary generated successfully!')
    } catch (error) {
      console.error('❌ Failed to generate summary:', error)
      // Fallback to demo data
      setSummary(demoSummary)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateQuestions = async () => {
    const currentText = getCurrentText()
    console.log('🎯 Starting question generation...')
    console.log('📝 Current text:', currentText.substring(0, 100) + '...')
    
    setIsGenerating(true)
    try {
      const questionsData = await geminiService.generateQuestions(currentText)
      setQuestions(questionsData)
      console.log('✅ Questions generated successfully!')
    } catch (error) {
      console.error('❌ Failed to generate questions:', error)
      // Fallback to demo data
      setQuestions(demoQuestions)
    } finally {
      setIsGenerating(false)
    }
  }

  // Spelling Quiz Functions
  const startSpellingQuiz = () => {
    console.log('🎮 Starting spelling quiz...')
    
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.')
      return
    }
    
    const words = getSpellingWords()
    console.log('📝 Quiz words:', words)
    
    setSpellingWords(words)
    setCurrentWordIndex(0)
    setSpellingScore(0)
    setUserSpelling('')
    setSpellingFeedback('')
    setShowSpellingFeedback(false)
    setShowSpellingQuiz(true)
    
    // Speak the first word after a delay to ensure modal is fully loaded
    setTimeout(() => {
      console.log('🔊 Speaking first word:', words[0])
      speakSpellingWord(words[0])
    }, 1000)
  }

  const speakSpellingWord = (word) => {
    if (word) {
      console.log('🔊 Attempting to speak word:', word)
      
      // Stop any current speech
      if (speechInstance) {
        speechSynthesis.cancel()
      }
      
      // Ensure voices are loaded
      const loadVoicesAndSpeak = () => {
        const voices = speechSynthesis.getVoices()
        console.log('📢 Available voices:', voices.length)
        
        if (voices.length === 0) {
          // Voices not loaded yet, wait and try again
          setTimeout(loadVoicesAndSpeak, 100)
          return
        }
        
        const speech = new SpeechSynthesisUtterance(word)
        speech.rate = 0.7 // Even slower for better comprehension
        speech.pitch = 1.0
        speech.volume = 1.0
        
        // Find the best voice
        let selectedVoice = voices.find(voice => 
          voice.lang.startsWith(selectedLanguage) && !voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith('en') && !voice.localService
        ) || voices[0]
        
        if (selectedVoice) {
          speech.voice = selectedVoice
          console.log('🎤 Using voice:', selectedVoice.name, selectedVoice.lang)
        }
        
        // Add event listeners for debugging
        speech.onstart = () => {
          console.log('✅ Speech started for word:', word)
          setIsSpeaking(true)
        }
        
        speech.onend = () => {
          console.log('🏁 Speech ended for word:', word)
          setIsSpeaking(false)
        }
        
        speech.onerror = (error) => {
          console.error('❌ Speech error:', error)
          setIsSpeaking(false)
          alert('Speech synthesis failed. Please try again or check your browser settings.')
        }
        
        // Speak the word
        speechSynthesis.speak(speech)
        setSpeechInstance(speech)
      }
      
      loadVoicesAndSpeak()
    }
  }

  const checkSpelling = () => {
    const currentWord = spellingWords[currentWordIndex]
    const userAnswer = userSpelling.trim().toLowerCase()
    const correctAnswer = currentWord.toLowerCase()
    
    setShowSpellingFeedback(true)
    
    if (userAnswer === correctAnswer) {
      setSpellingFeedback('Great job! You spelled it right.')
      setSpellingScore(prev => prev + 1)
    } else {
      setSpellingFeedback(`Not quite. The correct spelling is: ${currentWord}`)
    }
  }

  const nextSpellingWord = () => {
    if (currentWordIndex < spellingWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserSpelling('')
      setSpellingFeedback('')
      setShowSpellingFeedback(false)
      
      // Speak the next word
      setTimeout(() => {
        speakSpellingWord(spellingWords[currentWordIndex + 1])
      }, 500)
    } else {
      // Quiz complete
      setSpellingFeedback(`Quiz complete! You got ${spellingScore} out of ${spellingWords.length} words correct.`)
    }
  }

  const repeatSpellingWord = () => {
    speakSpellingWord(spellingWords[currentWordIndex])
  }

  const skipSpellingWord = () => {
    nextSpellingWord()
  }

  const closeSpellingQuiz = () => {
    setShowSpellingQuiz(false)
    setCurrentWordIndex(0)
    setUserSpelling('')
    setSpellingFeedback('')
    setShowSpellingFeedback(false)
    if (speechInstance) {
      speechSynthesis.cancel()
      setSpeechInstance(null)
      setIsSpeaking(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    })
  }

  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState({})

    const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers({...selectedAnswers, [questionIndex]: optionIndex})
    setShowResults({...showResults, [questionIndex]: true})
    
    // Gentle encouraging feedback
    const isCorrect = optionIndex === questions[questionIndex].correct
    const encouragements = {
      correct: [
        "Excellent work! 🌟 You're really understanding the material.",
        "Great job! 🎉 Your comprehension is impressive.",
        "Perfect! ✨ You've got this concept down pat.",
        "Wonderful! 🌈 Keep up the fantastic learning.",
        "Amazing! 🚀 You're making great progress."
      ],
      incorrect: [
        "Good try! 💪 Learning happens through practice.",
        "Almost there! 🌱 Every attempt helps you grow.",
        "Nice effort! 🌟 You're on the right track.",
        "Keep going! 🎯 Understanding comes with time.",
        "Well attempted! 💫 Each try teaches us something new."
      ]
    }
    
    // Show encouraging message briefly
    const messages = isCorrect ? encouragements.correct : encouragements.incorrect
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    
    // Store feedback message (this would be shown in the UI)
    setTimeout(() => {
      // Optionally speak the encouragement
      if (isCorrect) {
        speakText("Correct! Well done.", 'feedback')
      }
    }, 500)
  }

  // Get explanations for incorrect answers
  const getQuestionExplanation = (questionIndex) => {
    const explanations = {
      0: "The water cycle has four main stages that work together: evaporation (water becomes vapor), condensation (vapor forms clouds), precipitation (water falls), and collection (water gathers).",
      1: "The sun provides the energy needed for evaporation. Its heat turns liquid water into water vapor that rises into the atmosphere.",
      2: "During condensation, water vapor in the air cools down and forms tiny water droplets around particles, creating clouds in the sky."
    }
    return explanations[questionIndex] || "Keep studying the material to better understand this concept."
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    speechService.setLanguage(language)
  }

  // Text processing for dyslexia-friendly display
  const formatTextForReading = (text) => {
    if (!text) return ''
    
    // Split into paragraphs at double line breaks or natural breaks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
    
    return paragraphs.map((paragraph, pIndex) => {
      // Split each paragraph into sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim())
      
      return (
        <p key={pIndex}>
          {sentences.map((sentence, sIndex) => {
            const globalSentenceIndex = paragraphs.slice(0, pIndex).reduce((acc, p) => acc + p.split(/(?<=[.!?])\s+/).length, 0) + sIndex
            
            return (
              <span 
                key={sIndex} 
                className={`sentence ${focusedSentenceIndex === globalSentenceIndex ? 'focused' : ''}`}
                onClick={() => setFocusedSentenceIndex(focusedSentenceIndex === globalSentenceIndex ? -1 : globalSentenceIndex)}
              >
                {sentence.trim().split(' ').map((word, wIndex) => (
                  <span 
                    key={wIndex} 
                    className="word"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleWordClick(word)
                    }}
                  >
                    {word}
                    {wIndex < sentence.trim().split(' ').length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            )
          })}
        </p>
      )
    })
  }

  // Handle word click for dictionary lookup
  const handleWordClick = async (word) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
    setSelectedWord(cleanWord)
    
         // Simple word pronunciation (for demo)
     if ('speechSynthesis' in window) {
       // Stop any current reading first
       window.speechSynthesis.cancel()
       setIsSpeaking(false)
       setCurrentlyReading(null)
       
       const utterance = new SpeechSynthesisUtterance(cleanWord)
       utterance.rate = 0.6
       utterance.lang = selectedLanguage.includes('zh') ? selectedLanguage : 'en-US'
       window.speechSynthesis.speak(utterance)
     }
    
    // Mock definition (in production, you'd use a dictionary API)
    const mockDefinitions = {
      'water': 'A colorless, transparent liquid that forms seas, lakes, rivers, and rain.',
      'cycle': 'A series of events that repeat in a regular order.',
      'evaporation': 'The process of turning from liquid into vapor.',
      'condensation': 'Water vapor turning into liquid water droplets.',
      'precipitation': 'Rain, snow, sleet, or hail falling from clouds.',
      'atmosphere': 'The layer of gases surrounding Earth.',
      'temperature': 'How hot or cold something is.',
      'energy': 'The power to do work or cause change.'
    }
    
    const definition = mockDefinitions[cleanWord] || 'Click to hear pronunciation of this word.'
    setWordDefinition(definition)
    
    // Clear definition after 5 seconds
    setTimeout(() => {
      setSelectedWord(null)
      setWordDefinition('')
    }, 5000)
  }

  // Text-to-speech functionality
  const speakText = (text, contentType = 'transcript') => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8 // Slightly slower for dyslexic learners
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Set language based on selected language
      if (selectedLanguage.includes('zh')) {
        utterance.lang = selectedLanguage
      } else {
        utterance.lang = 'en-US'
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setCurrentlyReading(contentType)
      }
      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentlyReading(null)
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setCurrentlyReading(null)
      }
      
      window.speechSynthesis.speak(utterance)
    } else {
      alert('Text-to-speech is not supported in this browser')
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setCurrentlyReading(null)
    }
  }

  // Update progress when transcript changes
  useEffect(() => {
    if (transcript && transcript.length > 0) {
      setCurrentStep(2)
    }
  }, [transcript])

  // Update progress when AI content is generated
  useEffect(() => {
    if (summary.length > 0 || questions.length > 0) {
      setCurrentStep(3)
    }
  }, [summary, questions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger if not typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault()
            if (!isRecording) {
              startRecording()
            } else {
              stopRecording()
            }
            break
          case 'p':
            event.preventDefault()
            if (audioUrl) {
              togglePlayback()
            }
            break
          case 's':
            event.preventDefault()
            if (transcript) {
              generateSummary()
            }
            break
          case 'q':
            event.preventDefault()
            if (transcript) {
              generateQuestions()
            }
            break
          case 't':
            event.preventDefault()
            if (transcript) {
              (isSpeaking && currentlyReading === 'transcript') ? stopSpeaking() : speakText(transcript, 'transcript')
            }
            break
          default:
            break
        }
      }

             // Reading focus mode navigation
       if (isReadingMode) {
         if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
           event.preventDefault()
           setFocusedSentenceIndex(prev => prev + 1)
         } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
           event.preventDefault()
           setFocusedSentenceIndex(prev => Math.max(-1, prev - 1))
         } else if (event.key === 'Escape') {
           setIsReadingMode(false)
           setFocusedSentenceIndex(-1)
         }
       }

       // Quiz navigation
       if (questions.length > 0) {
         if (event.key >= '1' && event.key <= '4') {
           // Answer with number keys (1-4 for options A-D)
           const optionIndex = parseInt(event.key) - 1
           const currentQuestion = questions.findIndex((_, index) => !showResults[index])
           if (currentQuestion !== -1 && optionIndex < questions[currentQuestion].options.length) {
             event.preventDefault()
             handleAnswerSelect(currentQuestion, optionIndex)
           }
         }
       }
    }

         window.addEventListener('keydown', handleKeyDown)
     return () => window.removeEventListener('keydown', handleKeyDown)
   }, [isRecording, audioUrl, transcript, isSpeaking, currentlyReading, isReadingMode])

  // Load user preferences on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('echolearn-preferences')
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences)
        setColorScheme(prefs.colorScheme || 'light')
        setFontFamily(prefs.fontFamily || 'Arial, sans-serif')
        setFontSize(prefs.fontSize || 16)
        setLineHeight(prefs.lineHeight || 1.8)
        setSelectedLanguage(prefs.selectedLanguage || 'en-US')
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
  }, [])

  // File Upload Component
  const FileUploadComponent = () => {
    const onDrop = (acceptedFiles, fileRejections) => {
      try {
        console.log('📁 Files dropped:', acceptedFiles.length, 'accepted', fileRejections.length, 'rejected')
        
        if (fileRejections.length > 0) {
          const error = fileRejections[0].errors[0]
          setOcrError(`File rejected: ${error.message}`)
          return
        }
        
        if (acceptedFiles.length === 0) {
          setOcrError('No valid files were selected. Please try again.')
          return
        }
        
        handleFileUpload(acceptedFiles)
      } catch (error) {
        console.error('❌ File drop error:', error)
        setOcrError(`File upload error: ${error.message}`)
      }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/bmp': ['.bmp'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf']
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: false,
      noClick: false,
      noKeyboard: false
    })

    return (
      <div>
        <FileUploadZone 
          {...getRootProps()} 
          className={isDragActive ? 'drag-active' : ''}
        >
          <input {...getInputProps()} />
          <div className="upload-icon">
            <FileImage size={48} />
          </div>
          <div className="upload-text">
            {isDragActive ? 'Drop your files here' : 'Click or drag files to upload'}
          </div>
          <div className="upload-subtext">
            Supports images (JPG, PNG, GIF, BMP, WebP) and PDFs up to 10MB
          </div>
        </FileUploadZone>

        {uploadedFile && (
          <FileInfo>
            <div className="file-icon">
              <FileText size={24} />
            </div>
            <div className="file-details">
              <div className="file-name">{uploadedFile.name}</div>
              <div className="file-size">{ocrService.formatFileSize(uploadedFile.size)}</div>
            </div>
          </FileInfo>
        )}

        {isProcessingOCR && (
          <ProgressContainer>
            <div className="progress-label">
              Extracting text from your file... {ocrProgress}%
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </ProgressContainer>
        )}

        {ocrError && (
          <ErrorMessage>
            {ocrError}
            <button 
              onClick={() => {
                setOcrError('')
                setUploadedFile(null)
                setCurrentStep(1)
              }}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: 'transparent',
                color: 'inherit',
                border: '1px solid currentColor',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Error
            </button>
          </ErrorMessage>
        )}
      </div>
    )
  }

  // Save user preferences when they change
  const savePreferences = () => {
    const preferences = {
      colorScheme,
      fontFamily,
      fontSize,
      lineHeight,
      selectedLanguage
    }
    localStorage.setItem('echolearn-preferences', JSON.stringify(preferences))
    alert('Preferences saved! ✅')
  }

  const theme = colorSchemes[colorScheme]
  const customTheme = {
    ...theme,
    fontFamily,
    fontSize,
    lineHeight
  }

  return (
    <ThemeProvider theme={customTheme}>
      <GlobalStyle />
      <Container>
        <Header>
          <h1>EchoLearn</h1>
          <p>Transform documents and images into dyslexia-friendly study materials</p>
        </Header>

        {/* Progress Indicator */}
        <ProgressBar>
          <div className={`step ${currentStep >= 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending'}`}>
            <FileImage size={16} />
            1. Add Text
          </div>
          <ArrowRight size={16} className="arrow" />
          <div className={`step ${currentStep >= 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending'}`}>
            <FileText size={16} />
            2. Process Text
          </div>
          <ArrowRight size={16} className="arrow" />
          <div className={`step ${currentStep >= 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending'}`}>
            <Brain size={16} />
            3. Study Materials
          </div>
        </ProgressBar>

        <Grid>
          <MainContent>
            {/* File Upload Section */}
            <Card>
              <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>
                <FileImage style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Upload Files
              </h2>
              
              <InlineHelp>
                <HelpCircle size={16} className="help-icon" />
                Upload images or PDFs to extract text using OCR technology.
                <br />
                Supported formats: JPG, PNG, GIF, BMP, WebP, PDF
              </InlineHelp>
              
              <ErrorBoundary>
                <FileUploadComponent />
              </ErrorBoundary>
            </Card>

            {/* Paste Text Section */}
            <Card>
              <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>
                <Keyboard style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Paste Text
              </h2>
              
              <InlineHelp>
                <Keyboard size={16} className="help-icon" />
                Paste text directly from your clipboard to use with all study features.
                <br />
                Perfect for text you've already copied from documents or websites.
              </InlineHelp>
              
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  placeholder="Paste your text here..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '16px',
                    border: `2px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    fontSize: `${theme.fontSize}px`,
                    fontFamily: theme.fontFamily,
                    lineHeight: theme.lineHeight,
                    backgroundColor: theme.cardBackground,
                    color: theme.textColor,
                    resize: 'vertical'
                  }}
                  onPaste={(e) => {
                    // Handle paste event
                    setTimeout(() => {
                      const text = e.target.value
                      if (text.trim()) {
                        handlePasteText(text)
                      }
                    }, 10)
                  }}
                  onChange={(e) => {
                    // Handle manual typing
                    const text = e.target.value
                    if (text.trim()) {
                      handlePasteText(text)
                    }
                  }}
                />
              </div>
              
              <Button
                onClick={() => {
                  const textarea = document.querySelector('textarea')
                  if (textarea && textarea.value.trim()) {
                    handlePasteText(textarea.value)
                  }
                }}
                $variant="secondary"
                style={{ width: '100%' }}
              >
                <FilePlus size={20} />
                Process Pasted Text
              </Button>
            </Card>

            {/* Text Display */}
            <Card>
              <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>
                <FileText style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                {textSource === 'paste' ? 'Pasted Text' : 'Extracted Text'}
              </h2>
              
              <InlineHelp>
                <FileText size={16} className="help-icon" />
                {textSource === 'paste' 
                  ? 'Your pasted text will appear here. Click a sentence to highlight it, or click a word to hear how it\'s pronounced.'
                  : 'Text extracted from your uploaded files will appear here. Click a sentence to highlight it, or click a word to hear how it\'s pronounced.'
                }
                Press <strong>Ctrl/Cmd + T</strong> to listen to the text.
              </InlineHelp>

              {getCurrentText() && (
                <ReadingControls>
                  <span className="control-label">Reading Tools:</span>
                  <Button 
                    onClick={() => setIsReadingMode(!isReadingMode)}
                    $variant="tertiary"
                  >
                    {isReadingMode ? <EyeOff size={14} /> : <Eye size={14} />}
                    {isReadingMode ? 'Exit Focus Mode' : 'Focus Mode'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setFocusedSentenceIndex(-1)
                      setIsReadingMode(false)
                    }}
                    $variant="tertiary"
                  >
                    <Focus size={14} />
                    Clear Focus
                  </Button>
                  {isReadingMode && (
                    <span style={{ fontSize: '12px', color: theme.textColor, opacity: 0.7 }}>
                      Use arrow keys to navigate, ESC to exit
                    </span>
                  )}
                </ReadingControls>
              )}
              
              <TextDisplay
                $fontFamily={fontFamily}
                $fontSize={fontSize}
                $lineHeight={lineHeight}
              >
                {getCurrentText() ? formatTextForReading(getCurrentText()) : 'Your text will show up here after you upload a file or paste text.'}
              </TextDisplay>
              
              {getCurrentText() && (
                <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button 
                    $variant="tertiary"
                    onClick={() => copyToClipboard(getCurrentText())}
                    aria-label="Copy text to clipboard"
                  >
                    <Copy size={18} />
                    Copy to Clipboard
                  </Button>
                  <Button 
                    $variant="secondary"
                    onClick={() => (isSpeaking && currentlyReading === 'transcript') ? stopSpeaking() : speakText(getCurrentText(), 'transcript')}
                    style={{ 
                      ...(isSpeaking && currentlyReading === 'transcript' && {
                        background: '#dc2626',
                        borderColor: '#dc2626',
                        color: 'white'
                      })
                    }}
                    aria-label={(isSpeaking && currentlyReading === 'transcript') ? 'Stop reading text aloud' : 'Read text aloud'}
                  >
                    {(isSpeaking && currentlyReading === 'transcript') ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    {(isSpeaking && currentlyReading === 'transcript') ? 'Stop Reading' : 'Read Aloud'}
                  </Button>
                  <Button 
                    $variant="secondary" 
                    onClick={generateSummary} 
                    disabled={isGenerating}
                    aria-label="Generate AI-powered summary of the text"
                  >
                    <Brain size={20} />
                    {isGenerating ? 'Generating with AI...' : 'Summarize Text'}
                  </Button>
                  <Button 
                    $variant="secondary" 
                    onClick={generateQuestions} 
                    disabled={isGenerating}
                    aria-label="Create practice questions from the text"
                  >
                    <HelpCircle size={20} />
                    {isGenerating ? 'Generating with AI...' : 'MC Quiz'}
                  </Button>
                  <Button 
                    $variant="secondary" 
                    onClick={startSpellingQuiz} 
                    disabled={!getCurrentText()}
                    aria-label="Start spelling quiz with words from text"
                  >
                    <Keyboard size={20} />
                    Spelling Quiz
                  </Button>
                </div>
              )}
            </Card>

            {/* AI-Generated Summary */}
            {summary.length > 0 && (
              <Card>
                <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>
                  <Brain style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  AI Summary
                </h2>
                
                <InlineHelp>
                  <Brain size={16} className="help-icon" />
                  Key points from your transcript, optimized for dyslexic learners. 
                  Generated by AI using <strong>Ctrl/Cmd + S</strong>
                </InlineHelp>
                <SummarySection>
                  <ul>
                    {summary.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </SummarySection>
                <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button $variant="tertiary" onClick={() => copyToClipboard(summary.join('\n• '))}>
                    <Copy size={18} />
                    Copy to Clipboard
                  </Button>
                  <Button 
                    $variant="secondary"
                    onClick={() => (isSpeaking && currentlyReading === 'summary') ? stopSpeaking() : speakText(summary.join('. '), 'summary')}
                    style={{ 
                      ...(isSpeaking && currentlyReading === 'summary' && {
                        background: '#dc2626',
                        borderColor: '#dc2626',
                        color: 'white'
                      })
                    }}
                    aria-label={(isSpeaking && currentlyReading === 'summary') ? 'Stop reading summary aloud' : 'Read summary aloud'}
                  >
                    {(isSpeaking && currentlyReading === 'summary') ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    {(isSpeaking && currentlyReading === 'summary') ? 'Stop Reading' : 'Read Summary'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Practice Questions */}
            {questions.length > 0 && (
              <Card>
                <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>
                  <HelpCircle style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                      MC Quiz
                </h2>
                
                <InlineHelp>
                  <HelpCircle size={16} className="help-icon" />
                  Test your understanding with quick questions based on your lesson. Each question has helpful explanations.
                  Use <strong>Ctrl/Cmd + Q</strong> to generate, <strong>1-4 keys</strong> to answer (A-D options).
                </InlineHelp>
                <QuizSection>
                  {/* Progress Indicator */}
                  <QuizProgress>
                    Practice Quiz Progress: {Object.keys(showResults).length} of {questions.length} questions answered
                  </QuizProgress>

                  {questions.map((q, qIndex) => {
                    const isCorrect = selectedAnswers[qIndex] === q.correct
                    const hasAnswered = showResults[qIndex]
                    
                    return (
                      <QuestionCard key={qIndex}>
                        <div className="question-header">
                          <h3>Question {qIndex + 1} of {questions.length}</h3>
                          <Button 
                            $variant="tertiary"
                            onClick={() => speakText(q.question, 'question')}
                            aria-label={`Read question ${qIndex + 1} aloud`}
                            style={{ fontSize: '14px', padding: '8px 12px' }}
                          >
                            <Volume2 size={14} />
                            Read Question
                          </Button>
                        </div>
                        
                        <div className="question-text" role="heading" aria-level="4">
                          {q.question}
                        </div>
                        
                        <div role="radiogroup" aria-labelledby={`question-${qIndex}`}>
                          {q.options.map((option, oIndex) => (
                            <AnswerButton
                              key={oIndex}
                              onClick={() => handleAnswerSelect(qIndex, oIndex)}
                              disabled={hasAnswered}
                              className={
                                hasAnswered 
                                  ? oIndex === q.correct 
                                    ? 'correct' 
                                    : selectedAnswers[qIndex] === oIndex 
                                      ? 'incorrect' 
                                      : ''
                                  : ''
                              }
                              role="radio"
                              aria-checked={selectedAnswers[qIndex] === oIndex}
                              aria-label={`Option ${String.fromCharCode(65 + oIndex)}: ${option}`}
                            >
                              <strong>{String.fromCharCode(65 + oIndex)}.</strong> {option}
                            </AnswerButton>
                          ))}
                        </div>
                        
                        {hasAnswered && (
                          <FeedbackSection 
                            isCorrect={isCorrect}
                            role="alert"
                            aria-live="polite"
                          >
                            <div className="feedback-header">
                              <span className="feedback-icon">
                                {isCorrect ? '✓' : '✗'}
                              </span>
                              <span className="feedback-label">
                                {isCorrect ? 'Correct!' : 'Not quite right'}
                              </span>
                            </div>
                            
                            <div className="feedback-message">
                              {isCorrect 
                                ? "Excellent work! You're really understanding the material."
                                : "Good try! Every attempt helps you learn."
                              }
                            </div>
                            
                            {!isCorrect && (
                              <div className="feedback-explanation">
                                <strong>Tip:</strong> {getQuestionExplanation(qIndex)}
                              </div>
                            )}
                            
                            <Button 
                              onClick={() => speakText(
                                isCorrect 
                                  ? "Correct! Excellent work!" 
                                  : `Not quite right. ${getQuestionExplanation(qIndex)}`,
                                'feedback'
                              )}
                              $variant="tertiary"
                              style={{ marginTop: '12px' }}
                              aria-label="Read feedback aloud"
                            >
                              <Volume2 size={14} />
                              Read Feedback
                            </Button>
                          </FeedbackSection>
                        )}
                      </QuestionCard>
                    )
                  })}
                </QuizSection>
              </Card>
            )}
          </MainContent>

          {/* Customization Sidebar */}
          <Sidebar>
            <Card>
              <h2 style={{ marginBottom: '20px', color: theme.primaryColor }}>Personalize Your Reading Experience</h2>
              
              <ControlGroup>
                <label>Choose Your Font</label>
                <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS (Dyslexia-friendly)</option>
                  <option value="'OpenDyslexic', Arial, sans-serif">OpenDyslexic (Specialized for Dyslexia)</option>
                </Select>
              </ControlGroup>

              <ControlGroup>
                <label>Text Size: {fontSize}px</label>
                <Slider
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                />
              </ControlGroup>

              <ControlGroup>
                <label>Line Spacing: {lineHeight}</label>
                <Slider
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                />
              </ControlGroup>

              <ControlGroup>
                <label>Reading Voice</label>
                <Select value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
                  {speechService.getSupportedLanguages().map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </Select>
              </ControlGroup>

              <ControlGroup>
                <label>Color & Contrast</label>
                <Select 
                  value={colorScheme} 
                  onChange={(e) => setColorScheme(e.target.value)}
                  aria-label="Select color scheme for better readability"
                >
                  {Object.entries(colorSchemes).map(([key, scheme]) => (
                    <option key={key} value={key}>{scheme.name}</option>
                  ))}
                </Select>
              </ControlGroup>

              <ControlGroup>
                <Button 
                  onClick={savePreferences}
                  $variant="secondary"
                  style={{ width: '100%', marginTop: '16px' }}
                  aria-label="Save your accessibility preferences"
                >
                  <Download size={20} />
                  Save My Settings
                </Button>
              </ControlGroup>
            </Card>

            <Card>
              <h3 style={{ marginBottom: '16px', color: theme.primaryColor }}>AI Status</h3>
              <StatusBadge 
                $status={backendStatus === 'connected' ? 'connected' : backendStatus === 'checking' ? 'checking' : 'demo'}
                style={{ marginBottom: '16px' }}
              >
                <span className="status-icon">
                  {backendStatus === 'connected' ? '✅' : backendStatus === 'checking' ? '🔄' : '⚠️'}
                </span>
                {backendStatus === 'connected' ? 'Secure Backend Connected' : 
                 backendStatus === 'checking' ? 'Checking Backend...' : 
                 'Demo Mode (Backend Disconnected)'}
              </StatusBadge>
              
              <h3 style={{ marginBottom: '16px', color: theme.primaryColor }}>Accessibility Features</h3>
              <ul style={{ listStyle: 'none', fontSize: '14px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '8px' }}>📄 OCR text extraction from images and PDFs</li>
                <li style={{ marginBottom: '8px' }}>🖼️ Drag-and-drop file upload interface</li>
                <li style={{ marginBottom: '8px' }}>🔍 Advanced image preprocessing for better OCR</li>
                <li style={{ marginBottom: '8px' }}>📊 Real-time progress feedback during extraction</li>
                <li style={{ marginBottom: '8px' }}>📖 Text broken into readable paragraphs</li>
                <li style={{ marginBottom: '8px' }}>🔊 Text-to-speech for all content</li>
                <li style={{ marginBottom: '8px' }}>🎨 5 dyslexia-friendly color schemes</li>
                <li style={{ marginBottom: '8px' }}>📏 Optimal line length (45-65 characters)</li>
                <li style={{ marginBottom: '8px' }}>⚙️ Customizable fonts, sizes, and spacing</li>
                <li style={{ marginBottom: '8px' }}>💾 Save preferences between sessions</li>
                <li style={{ marginBottom: '8px' }}>📋 Progress tracking through workflow</li>
                <li style={{ marginBottom: '8px' }}>⌨️ Full keyboard navigation support</li>
                <li style={{ marginBottom: '8px' }}>🧠 Enhanced quiz with explanations</li>
                <li style={{ marginBottom: '8px' }}>🎯 Large, clickable answer buttons</li>
                <li style={{ marginBottom: '8px' }}>🔵 Clear button hierarchy (Primary/Secondary/Tertiary)</li>
                <li style={{ marginBottom: '8px' }}>🏷️ Status badges (not fake buttons)</li>
              </ul>
            </Card>

            <Card>
              <h3 style={{ marginBottom: '16px', color: theme.primaryColor }}>
                <Keyboard size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Keyboard Shortcuts
              </h3>
              <ul style={{ listStyle: 'none', fontSize: '13px', lineHeight: '1.5' }}>
                <li style={{ marginBottom: '6px' }}><strong>Ctrl/Cmd + R</strong> - Start/Stop Recording</li>
                <li style={{ marginBottom: '6px' }}><strong>Ctrl/Cmd + P</strong> - Play/Pause Audio</li>
                <li style={{ marginBottom: '6px' }}><strong>Ctrl/Cmd + T</strong> - Read Text Aloud</li>
                <li style={{ marginBottom: '6px' }}><strong>Ctrl/Cmd + S</strong> - Generate Summary</li>
                <li style={{ marginBottom: '6px' }}><strong>Ctrl/Cmd + Q</strong> - Create Quiz</li>
                <li style={{ marginBottom: '6px' }}><strong>Arrow Keys</strong> - Navigate in Focus Mode</li>
                <li style={{ marginBottom: '6px' }}><strong>1-4 Keys</strong> - Answer Quiz (A-D)</li>
                <li style={{ marginBottom: '6px' }}><strong>ESC</strong> - Exit Focus Mode</li>
              </ul>
            </Card>
          </Sidebar>
        </Grid>
        
        {/* Spelling Quiz Modal */}
        {showSpellingQuiz && (
          <SpellingQuizContainer>
            <SpellingQuizModal theme={theme}>
              <button 
                className="close-button" 
                onClick={closeSpellingQuiz}
                aria-label="Close spelling quiz"
              >
                ×
              </button>
              
              <div className="quiz-header">
                <h2>Spelling Quiz</h2>
                <div className="progress">
                  Word {currentWordIndex + 1} of {spellingWords.length}
                </div>
              </div>
              
              <div className="word-section">
                <div className="instruction">
                  Listen carefully and spell the word you hear
                </div>
                
                <div className="audio-controls">
                  <Button 
                    $variant="primary"
                    onClick={repeatSpellingWord}
                    aria-label="Repeat the word"
                  >
                    <Volume2 size={20} />
                    Repeat Word
                  </Button>
                </div>
              </div>
              
              <div className="input-section">
                <label htmlFor="spelling-input" className="input-label">
                  Type the word you heard:
                </label>
                <input
                  id="spelling-input"
                  type="text"
                  className="spelling-input"
                  value={userSpelling}
                  onChange={(e) => setUserSpelling(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !showSpellingFeedback && checkSpelling()}
                  placeholder="Enter spelling here..."
                  autoComplete="off"
                  spellCheck="true"
                  aria-label="Enter your spelling of the word"
                />
              </div>
              
              {!showSpellingFeedback ? (
                <div className="quiz-actions">
                  <Button
                    $variant="primary"
                    onClick={checkSpelling}
                    disabled={!userSpelling.trim()}
                    aria-label="Check your spelling"
                  >
                    Check Spelling
                  </Button>
                  <Button
                    $variant="tertiary"
                    onClick={skipSpellingWord}
                    aria-label="Skip this word"
                  >
                    Skip Word
                  </Button>
                </div>
              ) : (
                <SpellingFeedback 
                  isCorrect={spellingFeedback.includes('Great job')}
                  theme={theme}
                >
                  <div className="feedback-text">
                    {spellingFeedback}
                  </div>
                  <div className="feedback-actions">
                    <Button
                      $variant="secondary"
                      onClick={repeatSpellingWord}
                      aria-label="Hear the word again"
                    >
                      <Volume2 size={16} />
                      Hear Again
                    </Button>
                    {currentWordIndex < spellingWords.length - 1 ? (
                      <Button
                        $variant="primary"
                        onClick={nextSpellingWord}
                        aria-label="Continue to next word"
                      >
                        Next Word
                      </Button>
                    ) : (
                      <Button
                        $variant="primary"
                        onClick={closeSpellingQuiz}
                        aria-label="Close spelling quiz"
                      >
                        Finish Quiz
                      </Button>
                    )}
                  </div>
                </SpellingFeedback>
              )}
            </SpellingQuizModal>
          </SpellingQuizContainer>
        )}

        {/* Word Definition Popup */}
        {selectedWord && wordDefinition && (
          <WordDefinitionPopup>
            <div className="word-title">"{selectedWord}"</div>
            <div className="definition">{wordDefinition}</div>
          </WordDefinitionPopup>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App 