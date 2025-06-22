import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs';
import net from 'node:net';

const VIEWPORT = { width: 1200, height: 630 };
const buildId = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString();
const FILENAME = `og-index-${buildId}.png`;
const OUT_PATH = join(process.cwd(), 'public', FILENAME);
const PREVIEW_PORT = 4173;

async function waitForServer(port, host = 'localhost', timeout = 30000) {
  const start = Date.now();
  console.log(`Waiting for port ${port} to open...`);
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 500));
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ port, host });
        socket.on('connect', () => {
          socket.end();
          resolve(true);
        });
        socket.on('error', (err) => {
          reject(err);
        });
      });
      console.log(`Port ${port} is open!`);
      return true;
    } catch (err) {
      // Port not open yet
    }
  }
  throw new Error(`Timed out waiting for port ${port} to open.`);
}

async function main() {
  const previewProc = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  await waitForServer(PREVIEW_PORT);
  
  const previewURL = `https://localhost:${PREVIEW_PORT}/?og=true`;

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (err) {
    console.warn('Falling back to bundled Chromium – system Google Chrome not available:', err.message);
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
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