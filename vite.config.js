import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import viteImagemin from "vite-plugin-imagemin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  
  plugins: [
    react({
      // Enables SWC fast refresh and optimizations
      devtools: true,
      babel: {
        plugins: [
          // Optional: adds named components for better debugging
          ["@babel/plugin-transform-react-jsx", { 
            runtime: "automatic" 
          }]
        ]
      }
    }),
    
    // Conditional development plugins
    mode === 'development' && componentTagger(),
    
    // Performance and analysis plugins
    mode === 'production' && visualizer({
      filename: './stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    
    // Compression for production
    mode === 'production' && viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10kb
      algorithm: 'gzip',
      ext: '.gz',
    }),
    
    // Image optimization
    mode === 'production' && viteImagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: { plugins: [{ name: 'removeViewBox' }] },
    }),
    
    // Vendor chunk splitting
    splitVendorChunkPlugin(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  
  build: {
    minify: 'terser',
    sourcemap: mode === 'development',
    
    // Aggressive code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Smart chunk splitting
          if (id.includes('node_modules')) {
            // Core libraries in separate chunks
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('mapbox')) {
              return 'mapbox-vendor';
            }
            return 'vendor';
          }
        },
        
        // Chunk naming strategy
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    
    // Terser optimization
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
      format: {
        comments: false,
      },
    },
    
    // Performance budgets
    chunkSizeWarningLimit: 500, // kb
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'mapbox-gl/dist/mapbox-gl.css',
      'lucide-react'
    ],
    // Faster dependency pre-bundling
    esbuildOptions: {
      target: 'es2022',
    }
  },
  
  // Performance monitoring
  esbuild: {
    loader: 'tsx',
    target: 'es2022'
  }
}));