#!/usr/bin/env node

/**
 * Test script to verify Lighthouse Best Practices optimizations
 * Optimized for GitHub Pages deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Lighthouse Best Practices Optimizations for GitHub Pages...\n');

let allTestsPassed = true;
const testResults = [];

// Test 1: SecurityHeaders component exists
function testSecurityHeadersComponent() {
  console.log('1. Testing SecurityHeaders component...');
  const componentPath = path.join(__dirname, 'frontend', 'src', 'components', 'common', 'SecurityHeaders.tsx');
  
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const requiredFeatures = [
      'Content Security Policy',
      'X-Content-Type-Options',
      'Referrer Policy',
      'Permissions Policy',
      'StorageType.persistent is deprecated',
      'Cloudflare deprecation warning',
      'GitHub Pages CDN warning'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => !content.includes(feature));
    
    if (missingFeatures.length === 0) {
      console.log('   ✅ SecurityHeaders component found with all required features');
      testResults.push({ test: 'SecurityHeaders Component', status: 'PASS' });
      return true;
    } else {
      console.log(`   ❌ Missing features: ${missingFeatures.join(', ')}`);
      testResults.push({ test: 'SecurityHeaders Component', status: 'FAIL', details: missingFeatures });
      return false;
    }
  } else {
    console.log('   ❌ SecurityHeaders component not found');
    testResults.push({ test: 'SecurityHeaders Component', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Test 2: App.tsx integration
function testAppIntegration() {
  console.log('2. Testing App.tsx integration...');
  const appPath = path.join(__dirname, 'frontend', 'src', 'App.tsx');
  
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf8');
    // Check for import and usage anywhere in the file
    const hasImport = content.match(/import\s+SecurityHeaders\s+from ['"].*SecurityHeaders['"]/);
    const hasUsage = content.match(/<SecurityHeaders[\s>]/);
    if (hasImport && hasUsage) {
      console.log('   ✅ SecurityHeaders component properly integrated in App.tsx');
      testResults.push({ test: 'App.tsx Integration', status: 'PASS' });
      return true;
    } else {
      const missing = [];
      if (!hasImport) missing.push('import');
      if (!hasUsage) missing.push('usage');
      console.log(`   ❌ SecurityHeaders component not properly integrated (missing: ${missing.join(', ')})`);
      testResults.push({ test: 'App.tsx Integration', status: 'FAIL', details: `Missing ${missing.join(' and ')}` });
      return false;
    }
  } else {
    console.log('   ❌ App.tsx not found');
    testResults.push({ test: 'App.tsx Integration', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Test 3: Enhanced index.html
function testIndexHtml() {
  console.log('3. Testing enhanced index.html...');
  const indexPath = path.join(__dirname, 'frontend', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    const requiredFeatures = [
      'X-Content-Type-Options',
      'referrer',
      'Permissions-Policy',
      'GitHub Pages SPA routing',
      'Cloudflare deprecation warning',
      'StorageType.persistent is deprecated',
      'preload',
      'dns-prefetch'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => !content.includes(feature));
    
    if (missingFeatures.length === 0) {
      console.log('   ✅ index.html enhanced with all required features');
      testResults.push({ test: 'Enhanced index.html', status: 'PASS' });
      return true;
    } else {
      console.log(`   ❌ Missing features: ${missingFeatures.join(', ')}`);
      testResults.push({ test: 'Enhanced index.html', status: 'FAIL', details: missingFeatures });
      return false;
    }
  } else {
    console.log('   ❌ index.html not found');
    testResults.push({ test: 'Enhanced index.html', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Test 4: GitHub Pages 404.html
function test404Html() {
  console.log('4. Testing GitHub Pages 404.html...');
  const notFoundPath = path.join(__dirname, 'frontend', 'public', '404.html');
  
  if (fs.existsSync(notFoundPath)) {
    const content = fs.readFileSync(notFoundPath, 'utf8');
    
    if (content.includes('Single Page Apps for GitHub Pages') && 
        content.includes('spa-github-pages') &&
        content.includes('pathSegmentsToKeep')) {
      console.log('   ✅ 404.html configured for GitHub Pages SPA routing');
      testResults.push({ test: 'GitHub Pages 404.html', status: 'PASS' });
      return true;
    } else {
      console.log('   ❌ 404.html not properly configured for GitHub Pages');
      testResults.push({ test: 'GitHub Pages 404.html', status: 'FAIL', details: 'Missing SPA routing configuration' });
      return false;
    }
  } else {
    console.log('   ❌ 404.html not found');
    testResults.push({ test: 'GitHub Pages 404.html', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Test 5: _headers file
function testHeadersFile() {
  console.log('5. Testing _headers file...');
  const headersPath = path.join(__dirname, 'frontend', 'public', '_headers');
  
  if (fs.existsSync(headersPath)) {
    const content = fs.readFileSync(headersPath, 'utf8');
    
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
      'Cache-Control'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !content.includes(header));
    
    if (missingHeaders.length === 0) {
      console.log('   ✅ _headers file configured with security headers');
      testResults.push({ test: '_headers File', status: 'PASS' });
      return true;
    } else {
      console.log(`   ❌ Missing headers: ${missingHeaders.join(', ')}`);
      testResults.push({ test: '_headers File', status: 'FAIL', details: missingHeaders });
      return false;
    }
  } else {
    console.log('   ❌ _headers file not found');
    testResults.push({ test: '_headers File', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Test 6: Documentation
function testDocumentation() {
  console.log('6. Testing documentation...');
  const docsPath = path.join(__dirname, 'frontend', 'BEST_PRACTICES_OPTIMIZATION.md');
  
  if (fs.existsSync(docsPath)) {
    const content = fs.readFileSync(docsPath, 'utf8');
    
    if (content.includes('GitHub Pages') && 
        content.includes('SecurityHeaders') &&
        content.includes('Deprecated API Usage')) {
      console.log('   ✅ Documentation updated for GitHub Pages deployment');
      testResults.push({ test: 'Documentation', status: 'PASS' });
      return true;
    } else {
      console.log('   ❌ Documentation not properly updated');
      testResults.push({ test: 'Documentation', status: 'FAIL', details: 'Missing GitHub Pages references' });
      return false;
    }
  } else {
    console.log('   ❌ Documentation not found');
    testResults.push({ test: 'Documentation', status: 'FAIL', details: 'File not found' });
    return false;
  }
}

// Run all tests
console.log('Running tests...\n');

const tests = [
  testSecurityHeadersComponent,
  testAppIntegration,
  testIndexHtml,
  test404Html,
  testHeadersFile,
  testDocumentation
];

tests.forEach(test => {
  const result = test();
  if (!result) {
    allTestsPassed = false;
  }
  console.log('');
});

// Summary
console.log('📊 Test Results Summary:');
console.log('========================');

testResults.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.test}: ${result.status}`);
  if (result.details) {
    console.log(`   Details: ${Array.isArray(result.details) ? result.details.join(', ') : result.details}`);
  }
});

console.log('\n🎯 Overall Result:');
if (allTestsPassed) {
  console.log('✅ All tests passed! Lighthouse Best Practices optimizations are properly configured for GitHub Pages.');
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy to GitHub Pages');
  console.log('2. Run Lighthouse CI to verify score improvement');
  console.log('3. Monitor console for filtered warnings');
  console.log('4. Verify security headers in browser dev tools');
} else {
  console.log('❌ Some tests failed. Please review the issues above and fix them before deployment.');
  console.log('\n🔧 Fix the failing tests and run this script again.');
}

console.log('\n📚 For more information, see:');
console.log('- frontend/BEST_PRACTICES_OPTIMIZATION.md');
console.log('- LIGHTHOUSE_BEST_PRACTICES_FIX.md');

process.exit(allTestsPassed ? 0 : 1); 