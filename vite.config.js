import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * In development, serve the admin app at http://admin.localhost:<port>/.
 *
 * In production the routing middleware rewrites every admin route on
 * admin.talikotaharikrishna.com to /admin.html. Vite's dev server has no
 * middleware.js, so this does the same job for local work: any page request
 * on an admin.* host is answered with admin.html. (*.localhost resolves to
 * this machine in every current browser, so no hosts-file edit is needed.)
 */
const adminHostInDev = {
  name: 'admin-host-in-dev',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const host = String(req.headers.host || '')
      const isPage = req.headers.accept?.includes('text/html')
      if (host.startsWith('admin.') && isPage && !req.url.startsWith('/@') && !req.url.includes('.')) {
        req.url = '/admin.html'
      }
      next()
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), adminHostInDev],
  server: {
    // Honour PORT when the environment assigns one; default to 3000 locally.
    port: Number(process.env.PORT) || 3000,
    open: true,
  },
  worker: {
    // The cut-out worker imports onnxruntime-web as an ES module.
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // Warn earlier than the 500kB default so bundle creep gets noticed.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      // Two apps from one codebase: the public site, and the admin panel that
      // only exists on admin.talikotaharikrishna.com. Separate entries, so not
      // a byte of the panel ships to a visitor of the public site.
      ...(isSsrBuild ? {} : { input: { main: 'index.html', admin: 'admin.html' } }),
      output: {
        // Client only. In an SSR build react/react-dom are externals, and
        // Rollup refuses to put an external module in a manual chunk —
        // applying this unconditionally broke `vite build --ssr` outright.
        ...(isSsrBuild
          ? {}
          : {
              manualChunks: {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                // Kept out of the main chunk deliberately; it is reached only
                // through a dynamic import on /te routes.
                'i18n-te': ['./src/i18n/te.js'],
              },
            }),
      },
    },
  },
}))
