import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Replace with your actual Railway URL once you find it
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5001')
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['tesseract.js']
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