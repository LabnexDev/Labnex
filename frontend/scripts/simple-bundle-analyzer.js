#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Simple Bundle Analyzer\n');

try {
  const distDir = path.join(process.cwd(), 'dist');
  const assetsDir = path.join(distDir, 'assets');
  
  if (!fs.existsSync(distDir)) {
    console.log('📦 Building project first...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit' });
  }

  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found. Build may have failed.');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  const otherFiles = files.filter(file => !file.endsWith('.js') && !file.endsWith('.css'));

  console.log('📊 Bundle Analysis Results:\n');

  let totalJsSize = 0;
  let totalCssSize = 0;
  let totalOtherSize = 0;

  // Analyze JS files
  if (jsFiles.length > 0) {
    console.log('📜 JavaScript Files:');
    jsFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      totalJsSize += stats.size;

      if (stats.size > 1024 * 1024) {
        console.log(`  🚨 ${file}: ${sizeInMB} MB`);
      } else if (stats.size > 500 * 1024) {
        console.log(`  ⚠️  ${file}: ${sizeInKB} KB`);
      } else {
        console.log(`  ✅ ${file}: ${sizeInKB} KB`);
      }
    });
  }

  // Analyze CSS files
  if (cssFiles.length > 0) {
    console.log('\n🎨 CSS Files:');
    cssFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      totalCssSize += stats.size;
      console.log(`  ${file}: ${sizeInKB} KB`);
    });
  }

  // Analyze other files
  if (otherFiles.length > 0) {
    console.log('\n📁 Other Files:');
    otherFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      totalOtherSize += stats.size;
      console.log(`  ${file}: ${sizeInKB} KB`);
    });
  }

  // Summary
  const totalSize = totalJsSize + totalCssSize + totalOtherSize;
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  const jsSizeMB = (totalJsSize / (1024 * 1024)).toFixed(2);
  const cssSizeKB = (totalCssSize / 1024).toFixed(2);

  console.log('\n📈 Summary:');
  console.log(`  Total Bundle Size: ${totalSizeMB} MB`);
  console.log(`  JavaScript: ${jsSizeMB} MB`);
  console.log(`  CSS: ${cssSizeKB} KB`);
  console.log(`  Other: ${(totalOtherSize / 1024).toFixed(2)} KB`);

  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  if (totalSize > 2 * 1024 * 1024) {
    console.log('  🚨 CRITICAL: Bundle size exceeds 2MB - immediate optimization needed');
  } else if (totalSize > 1.5 * 1024 * 1024) {
    console.log('  ⚠️  WARNING: Bundle size is large (>1.5MB) - optimization recommended');
  } else if (totalSize > 1 * 1024 * 1024) {
    console.log('  ⚠️  NOTICE: Bundle size is moderate (>1MB) - consider optimization');
  } else {
    console.log('  ✅ GOOD: Bundle size is acceptable');
  }

  if (totalJsSize > 1.5 * 1024 * 1024) {
    console.log('  🚨 CRITICAL: JavaScript bundle is very large - code splitting needed');
  } else if (totalJsSize > 1 * 1024 * 1024) {
    console.log('  ⚠️  WARNING: JavaScript bundle is large - consider lazy loading');
  }

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (totalSize > 1.5 * 1024 * 1024) {
    console.log('  1. 🚨 Implement aggressive code splitting');
    console.log('  2. 🚨 Lazy load non-critical routes and components');
    console.log('  3. 🚨 Replace heavy dependencies with lighter alternatives');
  }
  
  if (jsFiles.length > 3) {
    console.log('  4. 📦 Consider consolidating JavaScript chunks');
  }
  
  if (totalJsSize > 1 * 1024 * 1024) {
    console.log('  5. 🔍 Audit imports for unused code');
    console.log('  6. 🎯 Implement dynamic imports for heavy components');
  }

  console.log('  7. 📊 Run "npm run analyze" for detailed bundle visualization');
  console.log('  8. 🧪 Test with "npm run wall-check" for performance validation');

  console.log('\n✅ Analysis complete!');

} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
} 