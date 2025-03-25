import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl'],
          // Add more granular chunks
          'radix-ui': [/@radix-ui/],
          'date-utils': ['date-fns'],
          'chart-libs': ['recharts'],
          core: ['react', 'react-dom', 'react-router-dom'],
          lodash: ['lodash-es']
        }
      }
    },
    modulePreload: {
      polyfill: false // Disable module preload polyfill if not needed
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['mapbox-gl', 'lodash-es'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  worker: {
    format: 'es'
  }
});
