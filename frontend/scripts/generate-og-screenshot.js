import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs';

const VIEWPORT = { width: 1200, height: 630 };
const buildId = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString();
const FILENAME = `og-index-${buildId}.png`;
const OUT_PATH = join(process.cwd(), 'public', FILENAME);
const PREVIEW_PORT = 4173;

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch {
      /* server not ready */
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Preview server did not start within ${timeout}ms`);
}

async function main() {
  // Start vite preview for built site
  const previewProc = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  // Wait for server up
  const previewURL = `http://localhost:${PREVIEW_PORT}/?og=true`;
  await waitForServer(previewURL, 15000);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (err) {
    console.warn('Falling back to bundled Chromium – system Google Chrome not available:', err.message);
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(previewURL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Ensure public dir exists
  const publicDir = join(process.cwd(), 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir);

  await page.screenshot({
    path: OUT_PATH,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });

  // If a dist folder exists (post-build), copy the asset there so it is deployed
  const distDir = join(process.cwd(), 'dist');
  try {
    if (existsSync(distDir)) {
      const targetPath = join(distDir, FILENAME);
      await fs.promises.copyFile(OUT_PATH, targetPath);

      // patch dist/index.html so meta tags reference the build-specific filename
      const indexPath = join(distDir, 'index.html');
      if (existsSync(indexPath)) {
        let html = await fs.promises.readFile(indexPath, 'utf8');
        html = html.replace(/https?:\/\/[^"']*\/og-index[^"']*\.png/g, `https://labnex.dev/${FILENAME}`);
        html = html.replace(/\/og-index[^"']*\.png/g, `/${FILENAME}`);
        await fs.promises.writeFile(indexPath, html);
      }
    }
  } catch (copyErr) {
    console.warn('Could not copy patched og image or update index.html:', copyErr.message);
  }

  console.log('✅ OG screenshot saved to', OUT_PATH);

  await browser.close();
  previewProc.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 