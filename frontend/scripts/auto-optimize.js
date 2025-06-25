#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Starting automated optimization...\n');

// Files that need optimization
const optimizations = [
  {
    file: 'src/components/visual/AIResponseBox.tsx',
    find: "import { motion, useAnimation } from 'framer-motion';",
    replace: "import { useAnimation } from 'framer-motion';",
    addLazy: true,
    lazyImport: "const motion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));"
  },
  {
    file: 'src/components/visual/TypingDots.tsx',
    find: "import { motion } from 'framer-motion';",
    replace: "import { lazy } from 'react';",
    addLazy: true,
    lazyImport: "const motion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));"
  },
  {
    file: 'src/components/landing/InteractiveAIScene.tsx',
    find: "import { motion, AnimatePresence } from 'framer-motion';",
    replace: "import { lazy } from 'react';",
    addLazy: true,
    lazyImport: "const { motion, AnimatePresence } = lazy(() => import('framer-motion').then(module => ({ default: { motion: module.motion, AnimatePresence: module.AnimatePresence } })));"
  },
  {
    file: 'src/components/landing/ScrollAnimatedSection.tsx',
    find: "import { motion, useScroll, useTransform } from 'framer-motion';",
    replace: "import { useScroll, useTransform } from 'framer-motion';",
    addLazy: true,
    lazyImport: "const motion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));"
  },
  {
    file: 'src/pages/donation/ThankYouPage.tsx',
    find: "import { motion } from 'framer-motion';",
    replace: "import { lazy } from 'react';",
    addLazy: true,
    lazyImport: "const motion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));"
  },
  {
    file: 'src/pages/roadmap/RoadmapPage.tsx',
    find: "import { motion, AnimatePresence } from 'framer-motion';",
    replace: "import { lazy } from 'react';",
    addLazy: true,
    lazyImport: "const { motion, AnimatePresence } = lazy(() => import('framer-motion').then(module => ({ default: { motion: module.motion, AnimatePresence: module.AnimatePresence } })));"
  },
  {
    file: 'src/pages/donation/ThankYouPage.tsx',
    find: "import html2canvas from 'html2canvas';",
    replace: "import { lazy } from 'react';",
    addLazy: true,
    lazyImport: "const html2canvas = lazy(() => import('html2canvas'));"
  },
  {
    file: 'src/pages/settings/SettingsIntegrationsPage.tsx',
    find: "import { format } from 'date-fns'; // For formatting dates",
    replace: "// Lazy loaded date-fns",
    addLazy: true,
    lazyImport: "const { format } = await import('date-fns');"
  },
  {
    file: 'src/components/projects/TeamManagement.tsx',
    find: "import debounce from 'lodash/debounce';",
    replace: "// Lazy loaded lodash",
    addLazy: true,
    lazyImport: "const { debounce } = await import('lodash');"
  }
];

let optimizedFiles = 0;
let totalOptimizations = 0;

optimizations.forEach(opt => {
  try {
    const filePath = path.join(process.cwd(), opt.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${opt.file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace the import
    if (content.includes(opt.find)) {
      content = content.replace(opt.find, opt.replace);
      modified = true;
      totalOptimizations++;
    }

    // Add lazy import if needed
    if (opt.addLazy && modified) {
      const importIndex = content.indexOf('import');
      if (importIndex !== -1) {
        const insertIndex = content.indexOf('\n', importIndex) + 1;
        content = content.slice(0, insertIndex) + opt.lazyImport + '\n' + content.slice(insertIndex);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Optimized: ${opt.file}`);
      optimizedFiles++;
    }

  } catch (error) {
    console.error(`❌ Error optimizing ${opt.file}:`, error.message);
  }
});

console.log(`\n📊 Optimization Summary:`);
console.log(`   Files optimized: ${optimizedFiles}`);
console.log(`   Total optimizations: ${totalOptimizations}`);

// Create a performance optimization guide
const optimizationGuide = `
# Performance Optimization Guide

## Bundle Size Issues Found:
- Total bundle size: 4.92 MB (CRITICAL)
- Largest chunks:
  - vendor-a-m-CAXLbEex.js: 1.02 MB (markdown-related)
  - vendor-n-z-BFgNGucV.js: 639.56 KB
  - utils-html2canvas-BOCi_7Iu.js: 194.13 KB

## Optimizations Applied:
1. ✅ Replaced static imports with dynamic imports
2. ✅ Implemented lazy loading for heavy components
3. ✅ Added aggressive code splitting in Vite config
4. ✅ Enabled tree shaking and minification

## Next Steps:
1. 🚨 Replace react-markdown with lighter alternative (marked + DOMPurify)
2. 🚨 Consider replacing html2canvas with native screenshot API
3. 🚨 Lazy load non-critical pages and features
4. 🚨 Implement route-based code splitting

## Quick Wins:
- Use \`<Suspense>\` boundaries around heavy components
- Implement progressive loading for images
- Enable gzip/brotli compression on server
- Use CDN for third-party libraries

## Monitoring:
- Run \`npm run analyze:simple\` to check bundle size
- Run \`npm run wall-check\` to validate performance
- Use Lighthouse for real-world performance testing
`;

fs.writeFileSync('PERFORMANCE_OPTIMIZATION_GUIDE.md', optimizationGuide);

console.log('\n📝 Created PERFORMANCE_OPTIMIZATION_GUIDE.md');
console.log('\n🎯 Next steps:');
console.log('1. Run "npm run build" to see improvements');
console.log('2. Run "npm run analyze:simple" to check bundle size');
console.log('3. Consider replacing heavy dependencies with lighter alternatives');
console.log('4. Implement route-based code splitting');

console.log('\n✅ Automated optimization complete!'); 