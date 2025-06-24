#!/usr/bin/env node

/**
 * Performance Optimization Script
 * 
 * This script helps optimize the application for better Lighthouse scores
 * by analyzing bundle size, identifying heavy dependencies, and suggesting optimizations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Performance Optimization Analysis\n');

// Analyze bundle sizes
function analyzeBundleSizes() {
  const distPath = path.join(__dirname, '../dist/assets');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return;
  }

  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  console.log('📦 Bundle Size Analysis:');
  console.log('========================\n');
  
  let totalSize = 0;
  const fileSizes = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalSize += sizeKB;
    
    fileSizes.push({
      name: file,
      size: sizeKB,
      path: filePath
    });
  });
  
  // Sort by size (largest first)
  fileSizes.sort((a, b) => b.size - a.size);
  
  fileSizes.forEach(file => {
    const sizeIndicator = file.size > 500 ? '🔴' : file.size > 200 ? '🟡' : '🟢';
    console.log(`${sizeIndicator} ${file.name}: ${file.size}KB`);
  });
  
  console.log(`\n📊 Total Bundle Size: ${totalSize}KB (${Math.round(totalSize / 1024 * 10) / 10}MB)`);
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('================================\n');
  
  const largeFiles = fileSizes.filter(file => file.size > 500);
  if (largeFiles.length > 0) {
    console.log('🔴 Large bundles detected:');
    largeFiles.forEach(file => {
      console.log(`   - ${file.name} (${file.size}KB) - Consider code splitting or lazy loading`);
    });
  }
  
  if (totalSize > 2000) {
    console.log('\n⚠️  Total bundle size is large. Consider:');
    console.log('   - Implementing more aggressive code splitting');
    console.log('   - Lazy loading non-critical components');
    console.log('   - Tree-shaking unused dependencies');
    console.log('   - Using dynamic imports for heavy libraries');
  }
}

// Check for common performance issues
function checkPerformanceIssues() {
  console.log('\n🔧 Performance Issue Check:');
  console.log('==========================\n');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const heavyDependencies = [
    'gsap',
    'animejs', 
    'html2canvas',
    'react-syntax-highlighter',
    'react-markdown',
    'remark-gfm',
    'lodash'
  ];
  
  console.log('📋 Heavy Dependencies Check:');
  heavyDependencies.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`   ⚠️  ${dep} - Consider lazy loading or alternatives`);
    }
  });
  
  // Check for unused dependencies
  console.log('\n🧹 Unused Dependencies Check:');
  console.log('   Run "npm run analyze" to check for unused dependencies');
  
  // PWA checklist
  console.log('\n📱 PWA Checklist:');
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  const swPath = path.join(__dirname, '../public/sw.js');
  
  if (fs.existsSync(manifestPath)) {
    console.log('   ✅ Web App Manifest exists');
  } else {
    console.log('   ❌ Web App Manifest missing');
  }
  
  if (fs.existsSync(swPath)) {
    console.log('   ✅ Service Worker exists');
  } else {
    console.log('   ❌ Service Worker missing');
  }
}

// Generate optimization report
function generateReport() {
  console.log('\n📄 Performance Optimization Report:');
  console.log('===================================\n');
  
  console.log('🎯 Target Lighthouse Scores:');
  console.log('   - Performance: 90+');
  console.log('   - Accessibility: 95+');
  console.log('   - Best Practices: 95+');
  console.log('   - SEO: 100');
  console.log('   - PWA: 90+\n');
  
  console.log('🚀 Quick Wins:');
  console.log('   - Enable gzip/brotli compression');
  console.log('   - Optimize images (WebP format)');
  console.log('   - Minimize render-blocking resources');
  console.log('   - Use CDN for external resources');
  console.log('   - Implement proper caching strategies\n');
  
  console.log('🔧 Advanced Optimizations:');
  console.log('   - Implement code splitting');
  console.log('   - Use React.memo for expensive components');
  console.log('   - Optimize bundle size with tree shaking');
  console.log('   - Implement virtual scrolling for large lists');
  console.log('   - Use web workers for heavy computations\n');
  
  console.log('📱 PWA Optimizations:');
  console.log('   - Ensure proper manifest.json');
  console.log('   - Implement service worker caching');
  console.log('   - Add offline functionality');
  console.log('   - Optimize app icons');
  console.log('   - Implement push notifications\n');
}

// Main execution
try {
  analyzeBundleSizes();
  checkPerformanceIssues();
  generateReport();
  
  console.log('✅ Performance analysis complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run "npm run build" to see the optimized bundle');
  console.log('   2. Test with Lighthouse in Chrome DevTools');
  console.log('   3. Monitor Core Web Vitals in production');
  
} catch (error) {
  console.error('❌ Error during performance analysis:', error.message);
  process.exit(1);
} 