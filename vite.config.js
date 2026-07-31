import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const JOBS_API_TARGET = 'https://job-aggregator-d0el.onrender.com'

// When set, route every other /api/* path to a local dev API shim
// (tools/dev-api-server.mjs). Off by default so a plain `vite dev` is
// identical to production: only the jobs/companies routes proxy out.
const DEV_API_URL = process.env.DEV_API_URL

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow overriding the dependency-optimization cache dir via env.
  // Useful when the project lives on a filesystem where Vite can't unlink
  // its cache (e.g. some sandboxed mounts).
  cacheDir: process.env.VITE_CACHE_DIR || undefined,
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
    // Other /api/* routes only proxy when DEV_API_URL is set; otherwise the
    // requests fall through to dbApi.js's static-data fallbacks, matching
    // how production behaves before deploy.
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
      ...(DEV_API_URL
        ? {
            '/api': {
              target: DEV_API_URL,
              changeOrigin: true,
            },
          }
        : {}),
    },
  },
  // Optimize for faster response times
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },
})
