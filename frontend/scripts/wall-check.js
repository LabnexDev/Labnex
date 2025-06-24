#!/usr/bin/env node

/**
 * Wall Check Script
 * 
 * This script validates the build against performance budgets and Lighthouse scores
 * to ensure the build passes CI/CD pipeline checks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧱 Wall Check - Performance Validation\n');

// Load performance budget
const budgetPath = path.join(__dirname, '../performance-budget.json');
let budget;
try {
  budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
} catch (error) {
  console.log('❌ Performance budget file not found. Creating default budget...');
  budget = {
    budgets: [
      { type: 'initial', maximumWarning: '1mb', maximumError: '2mb' },
      { type: 'anyComponentStyle', maximumWarning: '200kb', maximumError: '500kb' }
    ],
    lighthouse: {
      performance: 85,
      accessibility: 95,
      best_practices: 95,
      seo: 100,
      pwa: 90
    }
  };
}

// Check if dist directory exists
const distPath = path.join(__dirname, '../dist/assets');
if (!fs.existsSync(distPath)) {
  console.log('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze bundle sizes
function analyzeBundles() {
  console.log('📦 Bundle Size Analysis:');
  console.log('========================\n');
  
  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  let totalJsSize = 0;
  let totalCssSize = 0;
  const bundleSizes = {};
  
  // Analyze JS files
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalJsSize += sizeKB;
    
    // Extract chunk name from filename
    const chunkName = file.split('-')[0];
    if (!bundleSizes[chunkName]) {
      bundleSizes[chunkName] = 0;
    }
    bundleSizes[chunkName] += sizeKB;
  });
  
  // Analyze CSS files
  cssFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    totalCssSize += sizeKB;
  });
  
  const totalSize = totalJsSize + totalCssSize;
  
  console.log(`📊 Total Bundle Size: ${totalSize}KB (${Math.round(totalSize / 1024 * 10) / 10}MB)`);
  console.log(`   - JavaScript: ${totalJsSize}KB`);
  console.log(`   - CSS: ${totalCssSize}KB\n`);
  
  // Check against budgets
  const initialBudget = budget.budgets.find(b => b.type === 'initial');
  const styleBudget = budget.budgets.find(b => b.type === 'anyComponentStyle');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check initial bundle size
  if (initialBudget) {
    const maxWarning = parseSize(initialBudget.maximumWarning);
    const maxError = parseSize(initialBudget.maximumError);
    
    if (totalSize > maxError) {
      console.log(`🔴 Initial bundle size (${totalSize}KB) exceeds error threshold (${maxError}KB)`);
      hasErrors = true;
    } else if (totalSize > maxWarning) {
      console.log(`🟡 Initial bundle size (${totalSize}KB) exceeds warning threshold (${maxWarning}KB)`);
      hasWarnings = true;
    } else {
      console.log(`🟢 Initial bundle size (${totalSize}KB) within budget`);
    }
  }
  
  // Check CSS bundle size
  if (styleBudget) {
    const maxWarning = parseSize(styleBudget.maximumWarning);
    const maxError = parseSize(styleBudget.maximumError);
    
    if (totalCssSize > maxError) {
      console.log(`🔴 CSS bundle size (${totalCssSize}KB) exceeds error threshold (${maxError}KB)`);
      hasErrors = true;
    } else if (totalCssSize > maxWarning) {
      console.log(`🟡 CSS bundle size (${totalCssSize}KB) exceeds warning threshold (${maxWarning}KB)`);
      hasWarnings = true;
    } else {
      console.log(`🟢 CSS bundle size (${totalCssSize}KB) within budget`);
    }
  }
  
  // Check individual bundle budgets
  console.log('\n📋 Individual Bundle Analysis:');
  Object.entries(bundleSizes).forEach(([chunkName, size]) => {
    const bundleBudget = budget.budgets.find(b => b.name === chunkName);
    if (bundleBudget) {
      const maxWarning = parseSize(bundleBudget.maximumWarning);
      const maxError = parseSize(bundleBudget.maximumError);
      
      if (size > maxError) {
        console.log(`🔴 ${chunkName}: ${size}KB (exceeds ${maxError}KB limit)`);
        hasErrors = true;
      } else if (size > maxWarning) {
        console.log(`🟡 ${chunkName}: ${size}KB (exceeds ${maxWarning}KB warning)`);
        hasWarnings = true;
      } else {
        console.log(`🟢 ${chunkName}: ${size}KB`);
      }
    } else {
      console.log(`⚪ ${chunkName}: ${size}KB (no budget defined)`);
    }
  });
  
  return { hasErrors, hasWarnings, totalSize, bundleSizes };
}

// Parse size string (e.g., "1mb" -> 1024)
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)([kmg]?b)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'kb': return value;
    case 'mb': return value * 1024;
    case 'gb': return value * 1024 * 1024;
    default: return value;
  }
}

// Check PWA requirements
function checkPWARequirements() {
  console.log('\n📱 PWA Requirements Check:');
  console.log('==========================\n');
  
  const publicPath = path.join(__dirname, '../public');
  const distPath = path.join(__dirname, '../dist');
  
  let pwaScore = 0;
  const checks = [
    { name: 'Web App Manifest', path: 'manifest.json', weight: 20 },
    { name: 'Service Worker', path: 'sw.js', weight: 20 },
    { name: 'HTTPS', path: null, weight: 10, note: 'Must be deployed on HTTPS' },
    { name: 'App Icons', path: 'icon-192.svg', weight: 15 },
    { name: 'Theme Colors', path: 'manifest.json', weight: 10, check: 'theme_color' },
    { name: 'Display Mode', path: 'manifest.json', weight: 10, check: 'display' },
    { name: 'Start URL', path: 'manifest.json', weight: 10, check: 'start_url' },
    { name: 'Scope', path: 'manifest.json', weight: 5, check: 'scope' }
  ];
  
  checks.forEach(check => {
    if (check.path) {
      const filePath = path.join(publicPath, check.path);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${check.name}`);
        pwaScore += check.weight;
      } else {
        console.log(`❌ ${check.name} - Missing`);
      }
    } else {
      console.log(`ℹ️  ${check.name} - ${check.note}`);
      pwaScore += check.weight;
    }
  });
  
  console.log(`\n📊 PWA Score: ${pwaScore}/100`);
  
  const targetPWA = budget.lighthouse?.pwa || 90;
  if (pwaScore >= targetPWA) {
    console.log(`🟢 PWA score meets target (${targetPWA}+)`);
  } else {
    console.log(`🔴 PWA score below target (${targetPWA}+)`);
  }
  
  return pwaScore >= targetPWA;
}

// Generate recommendations
function generateRecommendations(bundleSizes) {
  console.log('\n💡 Optimization Recommendations:');
  console.log('================================\n');
  
  const largeBundles = Object.entries(bundleSizes).filter(([_, size]) => size > 500);
  
  if (largeBundles.length > 0) {
    console.log('🔴 Large bundles detected:');
    largeBundles.forEach(([name, size]) => {
      console.log(`   - ${name}: ${size}KB`);
    });
    console.log('\n   Recommendations:');
    console.log('   - Implement more aggressive lazy loading');
    console.log('   - Use dynamic imports for heavy dependencies');
    console.log('   - Consider code splitting for large components');
    console.log('   - Review if all dependencies are necessary');
  }
  
  console.log('\n🚀 Quick Wins:');
  console.log('   - Enable gzip/brotli compression on server');
  console.log('   - Use CDN for external resources');
  console.log('   - Optimize images (WebP format)');
  console.log('   - Implement proper caching strategies');
  
  console.log('\n🔧 Advanced Optimizations:');
  console.log('   - Use React.memo for expensive components');
  console.log('   - Implement virtual scrolling for large lists');
  console.log('   - Use web workers for heavy computations');
  console.log('   - Consider server-side rendering for critical pages');
}

// Main execution
try {
  const { hasErrors, hasWarnings, totalSize, bundleSizes } = analyzeBundles();
  const pwaPassed = checkPWARequirements();
  generateRecommendations(bundleSizes);
  
  console.log('\n📋 Wall Check Summary:');
  console.log('======================\n');
  
  if (hasErrors) {
    console.log('🔴 Wall Check FAILED - Errors detected');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('🟡 Wall Check PASSED with warnings');
    process.exit(0);
  } else {
    console.log('🟢 Wall Check PASSED - All checks passed');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Error during wall check:', error.message);
  process.exit(1);
} 