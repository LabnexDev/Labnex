#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Create basic SVG icons
const createIcon = (size) => {
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
        fill="white">L</text>
</svg>`;
};

// Create basic screenshot
const createScreenshot = (width, height, isWide = true) => {
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
};

console.log('🎨 Creating basic PWA icons...');

const publicDir = path.join(process.cwd(), 'public');

// Create icon-192.svg
const icon192 = createIcon(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);

// Create icon-512.svg
const icon512 = createIcon(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);

// Create screenshot-wide.svg
const screenshotWide = createScreenshot(1280, 720, true);
fs.writeFileSync(path.join(publicDir, 'screenshot-wide.svg'), screenshotWide);

// Create screenshot-narrow.svg
const screenshotNarrow = createScreenshot(750, 1334, false);
fs.writeFileSync(path.join(publicDir, 'screenshot-narrow.svg'), screenshotNarrow);

console.log('✅ Basic PWA icons created as SVG files');
console.log('📝 For production, convert these SVG files to PNG using a tool like:');
console.log('   - Online SVG to PNG converter');
console.log('   - Image editing software');
console.log('   - Command line tools like ImageMagick'); 