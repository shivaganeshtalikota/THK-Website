import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour PORT when the environment assigns one; default to 3000 locally.
    port: Number(process.env.PORT) || 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // Warn earlier than the 500kB default so bundle creep gets noticed.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // 'animation-vendor' used to list 'aos', which is no longer a
        // dependency — naming a missing package here fails the build.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion'],
        },
      },
    },
  },
})
