import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';
import bundleAnalyzer from 'vite-bundle-analyzer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    basicSsl() as any,
    bundleAnalyzer({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
  server: {
    https: {},
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-core': ['react', 'react-dom'],
          
          // Routing
          'router': ['react-router-dom'],
          
          // UI Libraries
          'ui-headless': ['@headlessui/react'],
          'ui-heroicons': ['@heroicons/react'],
          
          // Forms
          'forms-hook': ['react-hook-form'],
          'forms-resolvers': ['@hookform/resolvers'],
          'forms-zod': ['zod'],
          
          // Heavy libraries - split aggressively
          'markdown-core': ['react-markdown'],
          'markdown-syntax': ['react-syntax-highlighter'],
          'markdown-remark': ['remark-gfm'],
          
          // Animations
          'animations-framer': ['framer-motion'],
          'animations-gsap': ['gsap'],
          'animations-anime': ['animejs'],
          
          // Charts
          'charts': ['chart.js'],
          
          // Utilities
          'utils-date': ['date-fns'],
          'utils-lodash': ['lodash'],
          'utils-html2canvas': ['html2canvas'],
          
          // API
          'api-axios': ['axios'],
          
          // Query
          'query': ['@tanstack/react-query'],
          
          // Other heavy dependencies
          'other-heavy': ['react-helmet-async', 'react-hot-toast'],
        },
        chunkFileNames: (chunkInfo) => {
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    target: 'es2015',
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    drop: ['console', 'debugger'],
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    exclude: [
      'react-markdown',
      'react-syntax-highlighter',
      'html2canvas',
      'gsap',
      'animejs',
    ],
  },
  define: {
    // Remove development-only code
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  },
});
