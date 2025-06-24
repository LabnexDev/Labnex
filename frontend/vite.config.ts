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
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', 'clsx'],
        },
      },
    },
  },
  esbuild: {
    drop: ['console'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
