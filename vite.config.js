import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Use Railway URL for production
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://echolearn-production-5c3e.up.railway.app')
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://echolearn-production-5c3e.up.railway.app',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['tesseract.js']
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure workers are handled properly in production
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.worker.js')) {
            return 'assets/workers/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
}) 