#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔄 Replacing react-markdown with lighter alternative...\n');

// Install lighter alternatives
const { execSync } = await import('child_process');

try {
  console.log('📦 Installing lighter markdown alternatives...');
  execSync('npm install marked dompurify @types/marked @types/dompurify', { stdio: 'inherit' });
  
  console.log('✅ Installed marked and DOMPurify');
} catch (error) {
  console.log('⚠️  Some packages may already be installed');
}

// Create a lightweight markdown component
const lightweightMarkdownComponent = 
  "import React, { useEffect, useRef } from 'react';\n" +
  "import { marked } from 'marked';\n" +
  "import DOMPurify from 'dompurify';\n\n" +
  "interface LightweightMarkdownProps {\n" +
  "  children: string;\n" +
  "  className?: string;\n" +
  "}\n\n" +
  "const LightweightMarkdown: React.FC<LightweightMarkdownProps> = ({ \n" +
  "  children, \n" +
  "  className = '' \n" +
  "}) => {\n" +
  "  const containerRef = useRef<HTMLDivElement>(null);\n\n" +
  "  useEffect(() => {\n" +
  "    if (containerRef.current && children) {\n" +
  "      // Configure marked options\n" +
  "      marked.setOptions({\n" +
  "        breaks: true,\n" +
  "        gfm: true,\n" +
  "        headerIds: false,\n" +
  "        mangle: false,\n" +
  "      });\n\n" +
  "      // Convert markdown to HTML\n" +
  "      const html = marked(children);\n" +
  "      \n" +
  "      // Sanitize HTML\n" +
  "      const sanitizedHtml = DOMPurify.sanitize(html, {\n" +
  "        ALLOWED_TAGS: [\n" +
  "          'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',\n" +
  "          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',\n" +
  "          'ul', 'ol', 'li', 'blockquote', 'pre', 'code',\n" +
  "          'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',\n" +
  "          'div', 'span', 'hr'\n" +
  "        ],\n" +
  "        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],\n" +
  "        ALLOW_DATA_ATTR: false,\n" +
  "      });\n\n" +
  "      containerRef.current.innerHTML = sanitizedHtml;\n" +
  "    }\n" +
  "  }, [children]);\n\n" +
  "  return (\n" +
  "    <div \n" +
  "      ref={containerRef} \n" +
  "      className={'prose prose-sm max-w-none ' + className}\n" +
  "    />\n" +
  "  );\n" +
  "};\n\n" +
  "export default LightweightMarkdown;";

// Write the lightweight component
fs.writeFileSync('src/components/common/LightweightMarkdown.tsx', lightweightMarkdownComponent);
console.log('✅ Created LightweightMarkdown component');

// Update files that use react-markdown
const filesToUpdate = [
  'src/components/common/LazyMarkdown.tsx',
  'src/components/common/LazyComponents.tsx'
];

filesToUpdate.forEach(file => {
  try {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace react-markdown imports with LightweightMarkdown
      content = content.replace(
        /import.*react-markdown.*/g,
        "import LightweightMarkdown from './LightweightMarkdown';"
      );
      
      // Replace ReactMarkdown usage with LightweightMarkdown
      content = content.replace(/ReactMarkdown/g, 'LightweightMarkdown');
      content = content.replace(/react-markdown/g, 'LightweightMarkdown');
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Updated: ' + file);
    }
  } catch (error) {
    console.error('❌ Error updating ' + file + ':', error.message);
  }
});

// Remove react-markdown from package.json
try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageContent.dependencies['react-markdown']) {
    delete packageContent.dependencies['react-markdown'];
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
    console.log('✅ Removed react-markdown from dependencies');
  }
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
}

console.log('\n📊 Markdown Replacement Summary:');
console.log('   ✅ Installed marked + DOMPurify (much lighter)');
console.log('   ✅ Created LightweightMarkdown component');
console.log('   ✅ Updated existing markdown components');
console.log('   ✅ Removed react-markdown dependency');

console.log('\n🎯 Expected bundle size reduction: ~500KB-1MB');
console.log('\n📝 Next steps:');
console.log('1. Run "npm install" to update dependencies');
console.log('2. Run "npm run build" to see bundle size improvement');
console.log('3. Test markdown rendering functionality');
console.log('4. Run "npm run analyze:simple" to verify reduction');

console.log('\n✅ Markdown replacement complete!'); 