#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Simple SVG icon generator for PWA
function generateIcon(size, text = 'L') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" 
        fill="white">${text}</text>
</svg>`;
}

// Generate screenshots (placeholder)
function generateScreenshot(width, height, isWide = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#0f172a"/>
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="#1e293b" rx="8"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        fill="#3b82f6">Labnex</text>
  <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    ${isWide ? 'Desktop View' : 'Mobile View'}
  </text>
</svg>`;
}

// Convert SVG to PNG using a simple approach (in real implementation, you'd use a proper image library)
function svgToPng(svg, filename) {
  // For now, we'll create a simple HTML file that can be converted to PNG
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    svg { display: block; }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;
  
  fs.writeFileSync(path.join(process.cwd(), 'public', `${filename}.html`), html);
  console.log(`Created ${filename}.html (convert to PNG manually or use a tool like puppeteer)`);
}

console.log('🎨 Generating PWA icons...');

const publicDir = path.join(process.cwd(), 'public');

// Generate icons
const icons = [
  { size: 192, filename: 'icon-192' },
  { size: 512, filename: 'icon-512' }
];

icons.forEach(({ size, filename }) => {
  const svg = generateIcon(size);
  svgToPng(svg, filename);
});

// Generate screenshots
const screenshots = [
  { width: 1280, height: 720, filename: 'screenshot-wide', isWide: true },
  { width: 750, height: 1334, filename: 'screenshot-narrow', isWide: false }
];

screenshots.forEach(({ width, height, filename, isWide }) => {
  const svg = generateScreenshot(width, height, isWide);
  svgToPng(svg, filename);
});

console.log('✅ PWA icons generated!');
console.log('📝 Note: Convert the generated HTML files to PNG using a tool like puppeteer or manually');
console.log('📝 For production, use proper PNG icons with the correct sizes'); 