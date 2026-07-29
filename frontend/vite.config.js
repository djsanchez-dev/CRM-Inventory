import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Brotli + Gzip compression for production builds
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,        // only files > 1KB
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Reduce source map detail in production
    sourcemap: false,
    // Warn when a chunk exceeds this size
    chunkSizeWarningLimit: 500,
    // Split CSS into separate files per chunk
    cssCodeSplit: true,
    // Enable module preload polyfill for older browsers
    modulePreload: { polyfill: true },

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React framework
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library (large)
          'vendor-charts': ['recharts'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // PDF generation
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
})
