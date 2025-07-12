# OpenDyslexic Font Setup Instructions

## Step 1: Copy Font Files
Copy your OpenDyslexic font files to the `public/fonts/` directory:

```
public/
  fonts/
    OpenDyslexic-Regular.woff2
    OpenDyslexic-Regular.woff
    OpenDyslexic-Regular.ttf
    OpenDyslexic-Bold.woff2
    OpenDyslexic-Bold.woff
    OpenDyslexic-Bold.ttf
```

## Step 2: From your opendyslexic-0.91.12 folder:
1. Look for files ending in `.woff2`, `.woff`, and `.ttf`
2. Copy these files to `public/fonts/` directory
3. Rename them to match the expected names above

## Step 3: Expected File Names
Make sure your files are named exactly:
- `OpenDyslexic-Regular.woff2`
- `OpenDyslexic-Regular.woff` 
- `OpenDyslexic-Regular.ttf`
- `OpenDyslexic-Bold.woff2`
- `OpenDyslexic-Bold.woff`
- `OpenDyslexic-Bold.ttf`

## Step 4: Test
After copying the files, select "OpenDyslexic (Specialized for Dyslexia)" from the font dropdown in the app.

If it doesn't work, check the browser console (F12) for 404 errors indicating missing font files. 