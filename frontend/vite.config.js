import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite plugin that auto-starts the Express backend in dev mode.
 * This eliminates the need to manually run the backend separately.
 */
function backendPlugin() {
  const BACKEND_PORT = 3001
  let backendProcess = null
  let started = false

  return {
    name: 'auto-backend',

    /**
     * Start backend before the Vite dev server
     */
    configureServer(server) {
      // Skip if VITE_API_URL is explicitly set (points to external backend)
      if (process.env.VITE_API_URL && !process.env.VITE_API_URL.includes('localhost:3001')) {
        console.log('  ➜  Backend: using external', process.env.VITE_API_URL)
        return
      }

      const startBackend = async () => {
        if (started) return
        started = true

        // Resolve path to api/index.js from project root
        const apiEntry = path.resolve(__dirname, '..', 'api', 'index.js')

        console.log('  ➜  Starting backend...')

        backendProcess = spawn('node', [apiEntry], {
          cwd: path.resolve(__dirname, '..'),
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: String(BACKEND_PORT),
          },
        })

        backendProcess.stdout.on('data', (data) => {
          const msg = data.toString().trim()
          if (msg) console.log(`  [backend] ${msg}`)
        })

        backendProcess.stderr.on('data', (data) => {
          const msg = data.toString().trim()
          if (msg && !msg.includes('ExperimentalWarning')) {
            console.error(`  [backend:err] ${msg}`)
          }
        })

        backendProcess.on('error', (err) => {
          console.error('  ✖ Failed to start backend:', err.message)
          started = false
        })

        backendProcess.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.log(`  ✖ Backend exited with code ${code}`)
          }
          backendProcess = null
          started = false
        })

        // Wait for backend to be ready (poll health endpoint)
        const maxRetries = 30
        for (let i = 0; i < maxRetries; i++) {
          try {
            const res = await fetch(`http://localhost:${BACKEND_PORT}/api/health`)
            if (res.ok) {
              console.log('  ✓  Backend ready at http://localhost:' + BACKEND_PORT)
              return
            }
          } catch {}
          await new Promise(r => setTimeout(r, 500))
        }
        console.log('  ⚠  Backend started but health check timed out')
      }

      // Start as soon as the server is configured (before listening)
      startBackend()
    },

    /**
     * Cleanup on exit
     */
    closeBundle() {
      if (backendProcess) {
        backendProcess.kill('SIGTERM')
        backendProcess = null
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    backendPlugin(),
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
