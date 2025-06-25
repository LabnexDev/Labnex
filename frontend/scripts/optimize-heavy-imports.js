#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Analyzing heavy imports for optimization...\n');

const heavyDependencies = {
  'react-markdown': 'markdown',
  'react-syntax-highlighter': 'syntax-highlighter',
  'html2canvas': 'html2canvas',
  'gsap': 'gsap',
  'animejs': 'animejs',
  'chart.js': 'chart',
  'framer-motion': 'framer-motion',
  'react-helmet-async': 'helmet',
  'date-fns': 'date-fns',
  'lodash': 'lodash'
};

const srcDir = path.join(process.cwd(), 'src');
const filesToCheck = [];

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      filesToCheck.push(fullPath);
    }
  });
}

scanDirectory(srcDir);

console.log(`📁 Found ${filesToCheck.length} TypeScript/TSX files to analyze\n`);

const heavyImports = {};

filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      Object.keys(heavyDependencies).forEach(dep => {
        if (line.includes(`import`) && line.includes(dep)) {
          if (!heavyImports[dep]) {
            heavyImports[dep] = [];
          }
          heavyImports[dep].push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

console.log('🚨 Heavy imports found:\n');

Object.keys(heavyImports).forEach(dep => {
  const imports = heavyImports[dep];
  console.log(`📦 ${dep} (${imports.length} imports):`);
  imports.forEach(imp => {
    console.log(`  📄 ${imp.file}:${imp.line}`);
    console.log(`     ${imp.content}`);
  });
  console.log('');
});

console.log('💡 Optimization Recommendations:\n');

Object.keys(heavyImports).forEach(dep => {
  const category = heavyDependencies[dep];
  console.log(`🎯 ${dep}:`);
  console.log(`   - Use dynamic import: import(${JSON.stringify(dep)})`);
  console.log(`   - Wrap in LazyLoader component`);
  console.log(`   - Consider lighter alternatives`);
  console.log('');
});

console.log('📝 Next steps:');
console.log('1. Replace static imports with dynamic imports');
console.log('2. Use LazyLoader component for heavy components');
console.log('3. Consider replacing heavy dependencies with lighter alternatives');
console.log('4. Run "npm run build" to see bundle size improvements');

console.log('\n✅ Analysis complete!'); 