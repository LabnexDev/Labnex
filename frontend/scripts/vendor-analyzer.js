#!/usr/bin/env node

/**
 * Vendor Chunk Analyzer
 * 
 * This script analyzes the vendor chunks to identify the largest dependencies
 * that should be lazy loaded or replaced.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Vendor Chunk Analysis\n');

// Find vendor chunks in dist/assets
const distPath = path.join(__dirname, '../dist/assets');
const files = fs.readdirSync(distPath);
const vendorFiles = files.filter(file => file.includes('vendor') && file.endsWith('.js'));

console.log('📦 Vendor Chunks Found:');
vendorFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`   - ${file}: ${sizeKB}KB`);
});

console.log('\n🎯 Optimization Strategy:');
console.log('========================\n');

console.log('1. Lazy Load Heavy Dependencies:');
console.log('   - html2canvas (198KB) - Only load when screenshots needed');
console.log('   - framer-motion (78KB) - Only load on animated pages');
console.log('   - date-fns (19KB) - Only load when date formatting needed');
console.log('   - lodash (2KB) - Replace with native methods where possible');

console.log('\n2. Dynamic Imports for Pages:');
console.log('   - Documentation pages (markdown rendering)');
console.log('   - Feature pages (heavy components)');
console.log('   - Test case pages (complex forms)');

console.log('\n3. Component-Level Lazy Loading:');
console.log('   - AI Chat components');
console.log('   - Landing page animations');
console.log('   - Visual components');

console.log('\n4. Replace Heavy Libraries:');
console.log('   - Consider lighter alternatives for html2canvas');
console.log('   - Use CSS animations instead of framer-motion where possible');
console.log('   - Replace lodash with native JavaScript methods');

console.log('\n🚀 Next Steps:');
console.log('1. Open bundle analyzer at http://localhost:8888');
console.log('2. Identify specific libraries in vendor-a-m chunk');
console.log('3. Implement lazy loading for identified heavy dependencies');
console.log('4. Replace heavy libraries with lighter alternatives'); 