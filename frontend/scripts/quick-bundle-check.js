#!/usr/bin/env node

/**
 * Quick Bundle Size Check
 * 
 * This script quickly checks the bundle sizes from the last build
 * without running the full build process again.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Quick Bundle Size Check\n');

// Check if dist directory exists
const distPath = path.join(__dirname, '../dist/assets');

if (!fs.existsSync(distPath)) {
  console.log('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Get all JS files
const files = fs.readdirSync(distPath);
const jsFiles = files.filter(file => file.endsWith('.js'));

console.log('📦 Current Bundle Sizes:');
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

// Check for large chunks
const largeFiles = fileSizes.filter(file => file.size > 500);
if (largeFiles.length > 0) {
  console.log('\n🔴 Large chunks detected:');
  largeFiles.forEach(file => {
    console.log(`   - ${file.name} (${file.size}KB)`);
  });
  
  console.log('\n💡 Recommendations:');
  console.log('   - The vendor chunk is still too large');
  console.log('   - Consider implementing more aggressive lazy loading');
  console.log('   - Review if all heavy dependencies are necessary');
  console.log('   - Consider alternatives for large libraries');
}

console.log('\n✅ Quick check complete!'); 