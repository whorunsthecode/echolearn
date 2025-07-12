# EchoLearn MVP

Transform documents and images into customizable, dyslexia-friendly study materials using OCR technology.

## Features

📄 **File Upload & OCR Text Extraction**
- Drag-and-drop file upload interface
- Support for images (JPG, PNG, GIF, BMP, WebP) and PDFs
- Advanced OCR using Tesseract.js with image preprocessing
- Real-time progress feedback during text extraction

📝 **Dyslexia-Friendly Text Display**
- Customizable font families (Arial, Helvetica, Verdana, Comic Sans MS)
- Adjustable font size (12-24px)
- Variable line height for comfortable reading
- High contrast light/dark mode toggle

🧠 **AI-Powered Features**
- Automatic summary generation from transcripts
- Enhanced practice quiz with progress tracking
- Large, accessible answer buttons with A-D labels
- Instant feedback with explanations for wrong answers
- Text-to-speech for questions and feedback

⚡ **Accessibility & UX**
- Responsive design for all devices
- 5 dyslexia-friendly color schemes (light, cream, blue, yellow, dark)
- Clear button hierarchy (Primary/Secondary/Tertiary) with WCAG AA contrast
- Reading focus mode with sentence highlighting
- Click-to-pronounce word dictionary
- Full keyboard shortcut support
- Inline help and progress indicators
- Encouraging quiz feedback with explanations
- Status badges instead of fake buttons
- Copy-to-clipboard functionality

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Set up environment variables (optional):**
   ```bash
   # Create .env file for real Gemini API
   echo "VITE_GEMINI_API_KEY= > .env
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## Usage

### **Basic Workflow:**
1. **Upload Files:** Drag and drop or click to upload images or PDFs
2. **Text Extraction:** Wait for OCR processing to extract text from your files
3. **Customize Text:** Adjust font, size, and spacing in the sidebar
4. **Generate Content:** Click "Summarize Text" or "MC Quiz" for AI-powered study materials
5. **Study:** Use the practice questions to test understanding

### **Advanced Accessibility Features:**
- **Reading Focus Mode:** Click "Focus Mode" to highlight one sentence at a time
- **Word Pronunciation:** Click any word to hear it pronounced and see a definition
- **Enhanced Quiz:** Large buttons, progress tracking, explanations for wrong answers
- **Button Hierarchy:** Clear visual distinction between primary actions (blue), secondary actions (outlined), and utility actions (grey)
- **Status Indicators:** Proper badges for system status (not fake buttons)
- **Keyboard Shortcuts:** Use Ctrl/Cmd + R (record), S (summary), Q (quiz), T (read aloud), 1-4 (quiz answers)
- **Color Schemes:** Choose from 5 dyslexia-friendly themes in the sidebar
- **Progress Tracking:** Visual workflow indicator shows your current step
- **Preference Saving:** Your settings are automatically saved between sessions

## Testing OCR Functionality

To test the OCR text extraction:

1. **Create a test image:**
   - Open `test-image-generator.html` in your browser
   - Click "Download Test Image" to get a sample image with text
   
2. **Upload and test:**
   - Drag the downloaded image into the EchoLearn upload area
   - Watch the progress bar as text is extracted
   - Review the extracted text in dyslexia-friendly format
   
3. **Test with your own files:**
   - Take a photo of a document or textbook page
   - Upload screenshots of articles or PDFs
   - Try different image qualities to test OCR robustness

## Demo Mode

The MVP includes pre-loaded demo content for reliable demonstration:
- Sample OCR text extraction from images
- AI-generated bullet-point summary
- Multiple choice practice questions with feedback

## Tech Stack

- **Frontend:** React 18 with Vite
- **Styling:** Styled Components with responsive design
- **Audio:** Web Audio API / MediaRecorder API
- **Icons:** Lucide React
- **AI Integration:** Google Gemini API with demo fallbacks

## Deployment

Build for production:
```bash
npm run build
```

Deploy to Vercel, Netlify, or GitHub Pages for instant hosting.

## Future Enhancements

- Real speech-to-text API integration (Google Speech, Azure Speech)
- Enhanced Gemini prompts for better educational content
- User authentication and session storage
- Advanced dyslexia accessibility features
- Multi-language support for Hong Kong educational context
- Gemini Pro Vision for image/document analysis

## License

MIT License - Built for accessible education 