# EchoLearn Troubleshooting Guide

## Issue: Blank Page After File Upload

If you're experiencing a blank page after uploading a file, follow these steps to diagnose and fix the issue:

### 1. Check Browser Console

1. **Open Developer Tools** (Press F12 or right-click → Inspect)
2. **Click the Console tab**
3. **Look for error messages** (usually in red)
4. **Common errors to look for:**
   - `Failed to load tesseract.js`
   - `Canvas API errors`
   - `File reading errors`
   - `Memory errors`

### 2. Test OCR Functionality

1. **Open the debug page:** `http://localhost:3001/debug.html`
2. **Select a test image** (preferably small, clear text)
3. **Click "Test OCR"**
4. **Watch the console** for detailed logging

### 3. Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 80+ (Recommended)
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

**Unsupported Browsers:**
- ❌ Internet Explorer
- ❌ Very old mobile browsers

### 4. Common Issues and Solutions

#### Issue: "Failed to load tesseract.js"
**Solution:**
- Check your internet connection
- Disable ad blockers temporarily
- Clear browser cache
- Try a different browser

#### Issue: "Canvas API not supported"
**Solution:**
- Update your browser
- Enable JavaScript
- Disable strict privacy settings

#### Issue: "File too large" errors
**Solution:**
- Use images smaller than 10MB
- Compress images before upload
- Use common formats (JPG, PNG)

#### Issue: "No text extracted"
**Solution:**
- Use images with clear, high-contrast text
- Avoid handwritten text (use typed text)
- Ensure good lighting in photos
- Try different image formats

### 5. Performance Issues

#### Slow OCR Processing
- **Large images take longer** - resize images to 1000x1000px max
- **Complex images are slower** - use simple, clean text
- **First run is slower** - subsequent runs are faster

#### Memory Issues
- **Close other browser tabs**
- **Refresh the page** if it becomes unresponsive
- **Use smaller image files**

### 6. Debug Steps

1. **Check the network tab** for failed requests
2. **Verify file upload** - does the file info appear?
3. **Watch the progress bar** - does it start moving?
4. **Check console logs** - any errors or warnings?

### 7. Test Images

Create test images using the test generator:
1. Open `http://localhost:3001/test-image-generator.html`
2. Click "Download Test Image"
3. Upload this image to test basic functionality

### 8. Browser-Specific Issues

#### Chrome
- **Enable "Unsafe inline script execution"** in DevTools
- **Disable strict site isolation** for localhost

#### Firefox
- **Enable "javascript.options.shared_memory"** in about:config
- **Disable enhanced tracking protection** for localhost

#### Safari
- **Enable "Develop menu"** in Safari preferences
- **Disable "Prevent cross-site tracking"** for localhost

### 9. When All Else Fails

1. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** completely
3. **Try incognito/private browsing mode**
4. **Restart the development server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
5. **Check for JavaScript errors** in the console

### 10. Error Recovery

If the app becomes unresponsive:
1. **Refresh the page**
2. **Clear the error** using the "Clear Error" button
3. **Try a different file**
4. **Check the file format** (JPG, PNG work best)

### 11. Contact Support

If none of these steps work:
1. **Take a screenshot** of the error
2. **Copy the console error messages**
3. **Note your browser version**
4. **Include the file you're trying to upload**

## Expected Behavior

When working correctly, you should see:
1. ✅ File upload area with drag-and-drop
2. ✅ File info display after selection
3. ✅ Progress bar during OCR processing
4. ✅ Extracted text in dyslexia-friendly format
5. ✅ AI summary and quiz generation options

## Demo Mode

If OCR fails completely, the app will fall back to demo text to ensure you can still test the dyslexia-friendly features. 