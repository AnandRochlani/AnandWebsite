import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const JOBS_API_TARGET = 'https://job-aggregator-d0el.onrender.com'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize for better initial render and code splitting
    rollupOptions: {
      output: {
        // NOTE: Avoid custom manualChunks here.
        // The previous split created a circular dependency between chunks
        // (e.g. `vendor` <-> `react-vendor`) which can break at runtime on Vercel.
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps only in development
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  // Pre-optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  // Server configuration for development
  server: {
    // Do not set long-lived Cache-Control in dev — browsers cache /src/* as immutable and
    // reloads can serve stale JS/CSS and trigger MIME / module load failures.
    fs: {
      strict: false,
    },
    // Same-origin /api/public/jobs → Render (production uses Vercel serverless proxy).
    proxy: {
      '/api/public/jobs': {
        target: JOBS_API_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/public\/jobs/, '/jobs'),
      },
      '/api/public/companies': {
        target: JOBS_API_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/public\/companies/, '/companies'),
      },
    },
  },
  // Optimize for faster response times
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },
})
