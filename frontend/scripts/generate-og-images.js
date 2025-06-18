/* eslint-disable no-console */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1200;
const HEIGHT = 630;

const pages = [
  { slug: 'index', title: 'Labnex – AI-Powered Dev Platform' },
  { slug: 'features-project-management', title: 'Project Management' },
  { slug: 'features-test-case-management', title: 'Test Case Management' },
  { slug: 'features-notes-and-snippets', title: 'Notes & Snippets' },
  { slug: 'features-modern-development-platform', title: 'Modern Dev Platform' },
  { slug: 'features-discord-ai-integration', title: 'Discord AI Integration' },
  { slug: 'features-cli-automation', title: 'CLI Automation' },
  { slug: 'features-tech-stack', title: 'Labnex Tech Stack' },
  { slug: 'roadmap', title: 'Labnex Roadmap' },
  { slug: 'changelog', title: 'Labnex Changelog' },
  { slug: 'support', title: 'Labnex Support' },
];

async function render(title) {
  const svg = await satori(
    React.createElement(
      'div',
      {
        style: {
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#6366F1 0%,#3B82F6 50%,#06B6D4 100%)',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
          textAlign: 'center',
          padding: '60px',
        },
      },
      React.createElement('h1', { style: { fontSize: '72px', lineHeight: 1.1 } }, title)
    ),
    { width: WIDTH, height: HEIGHT }
  );
  const png = new Resvg(svg, { background: 'transparent' }).render();
  return png.asPng();
}

async function main() {
  const outDir = join(process.cwd(), 'public');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  for (const p of pages) {
    const buffer = await render(p.title);
    const filePath = join(outDir, `og-${p.slug}.png`);
    writeFileSync(filePath, buffer);
    console.log('OG image generated:', filePath);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 