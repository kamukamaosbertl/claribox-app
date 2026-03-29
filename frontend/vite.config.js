import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use our custom sw.js in public/ instead of auto-generating one
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      manifest: false, // We have our own manifest.json in public/
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode so you can test locally
        type: 'module',
      },
    }),
  ],
});