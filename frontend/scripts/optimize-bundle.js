const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle analysis and optimization script
class BundleOptimizer {
  constructor() {
    this.distPath = path.join(__dirname, '../dist');
    this.analysisPath = path.join(__dirname, '../dist/analysis.html');
    this.chunkSizes = new Map();
    this.optimizationRecommendations = [];
  }

  // Analyze bundle sizes
  analyzeBundle() {
    console.log('🔍 Analyzing bundle sizes...');
    
    if (!fs.existsSync(this.distPath)) {
      console.error('❌ Dist folder not found. Run "npm run build" first.');
      return false;
    }

    const assetsPath = path.join(this.distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      console.error('❌ Assets folder not found in dist.');
      return false;
    }

    const files = fs.readdirSync(assetsPath);
    let totalSize = 0;
    let jsFiles = [];
    let cssFiles = [];

    files.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      this.chunkSizes.set(file, {
        size: sizeInBytes,
        sizeKB: sizeInKB,
        sizeMB: sizeInMB,
        path: filePath
      });

      totalSize += sizeInBytes;

      if (file.endsWith('.js')) {
        jsFiles.push({ name: file, size: sizeInBytes, sizeKB, sizeMB });
      } else if (file.endsWith('.css')) {
        cssFiles.push({ name: file, size: sizeInBytes, sizeKB, sizeMB });
      }
    });

    // Sort by size (largest first)
    jsFiles.sort((a, b) => b.size - a.size);
    cssFiles.sort((a, b) => b.size - a.size);

    console.log('\n📊 Bundle Analysis Results:');
    console.log('='.repeat(60));
    
    console.log('\n🔴 LARGEST JAVASCRIPT CHUNKS:');
    jsFiles.slice(0, 10).forEach((file, index) => {
      const icon = index < 3 ? '🚨' : index < 5 ? '⚠️' : '📦';
      console.log(`${icon} ${file.name}: ${file.sizeMB} MB (${file.sizeKB} KB)`);
    });

    console.log('\n🎨 CSS FILES:');
    cssFiles.forEach(file => {
      console.log(`📄 ${file.name}: ${file.sizeKB} KB`);
    });

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n📈 TOTAL BUNDLE SIZE: ${totalSizeMB} MB`);

    // Performance analysis
    this.analyzePerformance(jsFiles, totalSize);
    
    return true;
  }

  // Analyze performance issues
  analyzePerformance(jsFiles, totalSize) {
    console.log('\n🎯 PERFORMANCE ANALYSIS:');
    console.log('='.repeat(60));

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const largestChunk = jsFiles[0];
    const largestChunkMB = parseFloat(largestChunk.sizeMB);

    // Check for oversized chunks
    if (largestChunkMB > 1) {
      this.optimizationRecommendations.push({
        type: 'CRITICAL',
        issue: `Largest chunk is ${largestChunkMB}MB (${largestChunk.name})`,
        recommendation: 'Split this chunk further or implement more aggressive lazy loading',
        impact: 'HIGH'
      });
    }

    if (largestChunkMB > 500) {
      this.optimizationRecommendations.push({
        type: 'WARNING',
        issue: `Large chunk detected: ${largestChunk.name} (${largestChunk.sizeKB}KB)`,
        recommendation: 'Consider code splitting or tree shaking',
        impact: 'MEDIUM'
      });
    }

    // Check total bundle size
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      this.optimizationRecommendations.push({
        type: 'CRITICAL',
        issue: `Total bundle size is ${totalSizeMB}MB`,
        recommendation: 'Implement aggressive code splitting and remove unused dependencies',
        impact: 'HIGH'
      });
    }

    // Check for multiple large chunks
    const largeChunks = jsFiles.filter(f => parseFloat(f.sizeMB) > 0.5);
    if (largeChunks.length > 3) {
      this.optimizationRecommendations.push({
        type: 'WARNING',
        issue: `${largeChunks.length} chunks larger than 500KB`,
        recommendation: 'Consolidate chunks or implement better chunking strategy',
        impact: 'MEDIUM'
      });
    }

    // Check for vendor chunks
    const vendorChunks = jsFiles.filter(f => f.name.includes('vendor'));
    if (vendorChunks.length > 0) {
      const vendorSize = vendorChunks.reduce((sum, f) => sum + f.size, 0);
      const vendorSizeMB = (vendorSize / (1024 * 1024)).toFixed(2);
      
      if (vendorSize > 1024 * 1024) { // 1MB
        this.optimizationRecommendations.push({
          type: 'CRITICAL',
          issue: `Vendor chunks total ${vendorSizeMB}MB`,
          recommendation: 'Split vendor chunks by library or implement dynamic imports',
          impact: 'HIGH'
        });
      }
    }

    // Check for markdown-related chunks
    const markdownChunks = jsFiles.filter(f => f.name.includes('markdown'));
    if (markdownChunks.length > 0) {
      const markdownSize = markdownChunks.reduce((sum, f) => sum + f.size, 0);
      const markdownSizeMB = (markdownSize / (1024 * 1024)).toFixed(2);
      
      if (markdownSize > 500 * 1024) { // 500KB
        this.optimizationRecommendations.push({
          type: 'WARNING',
          issue: `Markdown chunks total ${markdownSizeMB}MB`,
          recommendation: 'Implement lazy loading for markdown components',
          impact: 'MEDIUM'
        });
      }
    }
  }

  // Generate optimization recommendations
  generateRecommendations() {
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    console.log('='.repeat(60));

    if (this.optimizationRecommendations.length === 0) {
      console.log('✅ No critical issues found! Your bundle is well optimized.');
      return;
    }

    // Sort by impact
    const sorted = this.optimizationRecommendations.sort((a, b) => {
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    sorted.forEach((rec, index) => {
      const icon = rec.type === 'CRITICAL' ? '🚨' : '⚠️';
      console.log(`\n${icon} ${rec.type}: ${rec.issue}`);
      console.log(`   💡 ${rec.recommendation}`);
      console.log(`   📊 Impact: ${rec.impact}`);
    });

    console.log('\n🔧 QUICK FIXES:');
    console.log('1. Run "npm run analyze" to see detailed bundle analysis');
    console.log('2. Check for unused dependencies with "npm run deps:check"');
    console.log('3. Implement lazy loading for heavy components');
    console.log('4. Consider using dynamic imports for large libraries');
  }

  // Check for unused dependencies
  checkUnusedDependencies() {
    console.log('\n🔍 Checking for unused dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      console.log('\n📦 Dependencies that might be unused:');
      const potentiallyUnused = [
        'framer-motion',
        'gsap',
        'animejs',
        'html2canvas',
        'lodash',
        'date-fns',
        'react-helmet-async',
        'react-hot-toast'
      ];

      potentiallyUnused.forEach(dep => {
        if (dependencies[dep]) {
          console.log(`⚠️  ${dep} - Consider lazy loading or removal`);
        }
      });
    } catch (error) {
      console.error('❌ Error reading package.json:', error.message);
    }
  }

  // Generate optimization report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalSize: this.getTotalSize(),
      largestChunk: this.getLargestChunk(),
      recommendations: this.optimizationRecommendations,
      chunkCount: this.chunkSizes.size
    };

    const reportPath = path.join(__dirname, '../bundle-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Optimization report saved to: ${reportPath}`);
    return report;
  }

  getTotalSize() {
    let total = 0;
    for (const [_, data] of this.chunkSizes) {
      total += data.size;
    }
    return {
      bytes: total,
      kb: (total / 1024).toFixed(2),
      mb: (total / (1024 * 1024)).toFixed(2)
    };
  }

  getLargestChunk() {
    let largest = null;
    for (const [name, data] of this.chunkSizes) {
      if (!largest || data.size > largest.size) {
        largest = { name, ...data };
      }
    }
    return largest;
  }

  // Run full optimization analysis
  run() {
    console.log('🚀 Starting Bundle Optimization Analysis...\n');
    
    const success = this.analyzeBundle();
    if (!success) {
      return;
    }

    this.checkUnusedDependencies();
    this.generateRecommendations();
    this.generateReport();

    console.log('\n✅ Bundle optimization analysis complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the recommendations above');
    console.log('2. Implement lazy loading for heavy components');
    console.log('3. Consider removing unused dependencies');
    console.log('4. Run Lighthouse audit to measure improvements');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.run();
}

module.exports = BundleOptimizer; 