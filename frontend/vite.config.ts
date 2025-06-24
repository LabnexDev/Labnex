import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', deleteOriginFile: false }),
    viteCompression({ algorithm: 'gzip', deleteOriginFile: false }),
    basicSsl() as any,
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
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'ui-vendor': ['@headlessui/react', 'clsx', '@heroicons/react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'animation-vendor': ['framer-motion', 'gsap', 'animejs'],
          'data-vendor': ['@tanstack/react-query', 'axios'],
          'utils-vendor': ['date-fns', 'lodash', 'html2canvas'],
          'markdown-vendor': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
        },
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
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
      '@headlessui/react',
      '@heroicons/react',
      'clsx',
    ],
  },
});
