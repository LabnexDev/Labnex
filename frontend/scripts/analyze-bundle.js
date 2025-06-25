#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Analyzing bundle size...\n');

try {
  // Build the project with bundle analysis
  console.log('📦 Building project with bundle analysis...');
  
  // Check if rollup-plugin-visualizer is available
  try {
    execSync('npm list rollup-plugin-visualizer', { stdio: 'pipe' });
  } catch (error) {
    console.log('📊 Installing rollup-plugin-visualizer...');
    execSync('npm install --save-dev rollup-plugin-visualizer', { stdio: 'inherit' });
  }

  // Create a temporary vite config for analysis
  const tempConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          charts: ['chart.js'],
          animations: ['framer-motion', 'gsap', 'animejs'],
          markdown: ['react-markdown', 'react-syntax-highlighter', 'remark-gfm']
        }
      }
    }
  }
})
`;

  fs.writeFileSync('vite.config.analysis.js', tempConfig);

  // Build with analysis
  execSync('npx vite build --config vite.config.analysis.js', { stdio: 'inherit' });

  // Clean up temp config
  fs.unlinkSync('vite.config.analysis.js');

  // Analyze file sizes
  const assetsDir = path.join(process.cwd(), 'dist', 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    
    console.log('\n📏 Bundle file sizes:');
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      totalSize += stats.size;
      
      if (stats.size > 1024 * 1024) {
        console.log(`⚠️  ${file}: ${sizeInMB} MB`);
      } else if (stats.size > 500 * 1024) {
        console.log(`⚠️  ${file}: ${sizeInKB} KB`);
      } else {
        console.log(`✅ ${file}: ${sizeInKB} KB`);
      }
    });

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n📊 Total bundle size: ${totalSizeMB} MB`);

    if (totalSize > 2 * 1024 * 1024) {
      console.log('🚨 Bundle size is too large! (>2MB)');
    } else if (totalSize > 1 * 1024 * 1024) {
      console.log('⚠️  Bundle size is large (>1MB)');
    } else {
      console.log('✅ Bundle size is acceptable');
    }
  }

  console.log('\n🎯 Performance recommendations:');
  console.log('1. Check bundle-analysis.html for detailed breakdown');
  console.log('2. Consider lazy loading heavy components');
  console.log('3. Split vendor chunks more aggressively');
  console.log('4. Replace heavy dependencies with lighter alternatives');
  console.log('5. Enable tree shaking for unused code');

  console.log('\n📈 Bundle analysis complete! Check bundle-analysis.html for detailed visualization.');

} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
} 