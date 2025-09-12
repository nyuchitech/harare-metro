// vite.config.js - Updated to suppress SES warnings
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API calls to local worker
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      // Proxy worker assets
      '/worker': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  define: {
    // Ensure environment variables are available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Inject Supabase configuration for production build from environment variables
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@heroicons/react', 'lucide-react'],
        },
      },
    },
  },
})