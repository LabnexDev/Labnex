#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Analyzing bundle size...\n');

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if bundle analyzer is available
  try {
    execSync('npx vite-bundle-analyzer dist/assets', { stdio: 'inherit' });
  } catch (error) {
    console.log('📊 Bundle analyzer not available. Installing...');
    execSync('npm install --save-dev vite-bundle-analyzer', { stdio: 'inherit' });
    execSync('npx vite-bundle-analyzer dist/assets', { stdio: 'inherit' });
  }

  // Analyze file sizes
  const assetsDir = path.join(process.cwd(), 'dist', 'assets');
  const files = fs.readdirSync(assetsDir);
  
  console.log('\n📏 File sizes:');
  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > 1024 * 1024) {
      console.log(`⚠️  ${file}: ${sizeInMB} MB`);
    } else {
      console.log(`✅ ${file}: ${sizeInKB} KB`);
    }
  });

  console.log('\n🎯 Performance recommendations:');
  console.log('1. Consider code splitting for large components');
  console.log('2. Lazy load non-critical routes and components');
  console.log('3. Optimize images and use WebP format');
  console.log('4. Enable gzip/brotli compression on server');
  console.log('5. Use CDN for third-party libraries');

} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
} 