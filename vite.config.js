import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
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
        // Client only. In an SSR build react/react-dom are externals, and
        // Rollup refuses to put an external module in a manual chunk —
        // applying this unconditionally broke `vite build --ssr` outright.
        ...(isSsrBuild
          ? {}
          : {
              manualChunks: {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              },
            }),
      },
    },
  },
}))
