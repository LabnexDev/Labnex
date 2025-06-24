import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import basicSsl from '@vitejs/plugin-basic-ssl';
import bundleAnalyzer from 'vite-bundle-analyzer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', deleteOriginFile: false }),
    viteCompression({ algorithm: 'gzip', deleteOriginFile: false }),
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
        passes: 3,
        dead_code: true,
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        sequences: true,
        side_effects: true,
        unused: true,
      },
      mangle: {
        safari10: true,
        toplevel: true,
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Ultra-aggressive chunking strategy
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            
            // Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // UI libraries - split further
            if (id.includes('@headlessui/react')) {
              return 'ui-headlessui';
            }
            if (id.includes('clsx')) {
              return 'ui-clsx';
            }
            if (id.includes('@heroicons/react')) {
              return 'ui-icons';
            }
            
            // Form handling - split further
            if (id.includes('react-hook-form')) {
              return 'form-hook-form';
            }
            if (id.includes('@hookform/resolvers')) {
              return 'form-resolvers';
            }
            if (id.includes('zod')) {
              return 'form-zod';
            }
            
            // Animation libraries - split further
            if (id.includes('framer-motion')) {
              return 'animation-framer';
            }
            if (id.includes('gsap')) {
              return 'animation-gsap';
            }
            if (id.includes('animejs')) {
              return 'animation-animejs';
            }
            
            // Data fetching - split further
            if (id.includes('@tanstack/react-query')) {
              return 'data-query';
            }
            if (id.includes('axios')) {
              return 'data-axios';
            }
            
            // Utils - split further
            if (id.includes('date-fns')) {
              return 'utils-date-fns';
            }
            if (id.includes('lodash')) {
              return 'utils-lodash';
            }
            if (id.includes('html2canvas')) {
              return 'utils-html2canvas';
            }
            
            // Markdown - split further
            if (id.includes('react-markdown')) {
              return 'markdown-react';
            }
            if (id.includes('react-syntax-highlighter')) {
              return 'markdown-syntax';
            }
            if (id.includes('remark-gfm')) {
              return 'markdown-remark';
            }
            
            // Other heavy dependencies - split further
            if (id.includes('react-helmet-async')) {
              return 'utils-helmet';
            }
            if (id.includes('react-hot-toast')) {
              return 'ui-toast';
            }
            
            // Group remaining vendor dependencies by type
            if (id.includes('@types/')) {
              return 'vendor-types';
            }
            
            // Split remaining vendor by first letter to break up large chunks
            const moduleName = id.split('node_modules/')[1]?.split('/')[0];
            if (moduleName) {
              const firstChar = moduleName.charAt(0).toLowerCase();
              if (firstChar >= 'a' && firstChar <= 'm') {
                return 'vendor-a-m';
              } else if (firstChar >= 'n' && firstChar <= 'z') {
                return 'vendor-n-z';
              }
            }
            
            return 'vendor-other';
          }
          
          // Split application code more aggressively
          if (id.includes('/pages/')) {
            if (id.includes('/pages/documentation/')) {
              return 'pages-documentation';
            }
            if (id.includes('/pages/features/')) {
              return 'pages-features';
            }
            if (id.includes('/pages/auth/')) {
              return 'pages-auth';
            }
            if (id.includes('/pages/projects/')) {
              return 'pages-projects';
            }
            if (id.includes('/pages/test-cases/')) {
              return 'pages-test-cases';
            }
            return 'pages-other';
          }
          
          if (id.includes('/components/')) {
            if (id.includes('/components/landing/')) {
              return 'components-landing';
            }
            if (id.includes('/components/ai-chat/')) {
              return 'components-ai-chat';
            }
            if (id.includes('/components/common/')) {
              return 'components-common';
            }
            if (id.includes('/components/visual/')) {
              return 'components-visual';
            }
            return 'components-other';
          }
          
          if (id.includes('/contexts/')) {
            return 'contexts';
          }
          
          if (id.includes('/api/')) {
            return 'api';
          }
          
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          
          if (id.includes('/utils/')) {
            return 'utils';
          }
          
          if (id.includes('/types/')) {
            return 'types';
          }
        },
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'es2015',
    chunkSizeWarningLimit: 200, // Very strict warning limit
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
      '@headlessui/react',
      '@heroicons/react',
      'clsx',
    ],
    exclude: [
      // Exclude all heavy dependencies from pre-bundling
      'gsap',
      'animejs',
      'html2canvas',
      'react-syntax-highlighter',
      'react-markdown',
      'remark-gfm',
      'lodash',
      'react-helmet-async',
      'react-hot-toast',
    ],
  },
  define: {
    // Remove development-only code
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  },
});
