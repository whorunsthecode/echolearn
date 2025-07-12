import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  define: {
    'process.env': {}
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