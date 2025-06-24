/* eslint-disable no-console */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Config
const BASE_URL = 'https://www.labnex.dev';
const APP_FILE = resolve(process.cwd(), 'src', 'App.tsx');

// Paths we don't want to list publicly (auth-gated or utility pages)
const DISALLOWED_PATHS = [
  '/login',
  '/register',
  '/dashboard',
  '/projects',
  '/settings',
  '/notifications',
  '/integrations',
  '/notes',
  '/snippets',
  '/admin',
  '/my-tasks',
  '/users',
  '/tasks',
  '/reset-password',
  '/reset-requested',
  '/ai', // landing for logged-in AI chat
  '/ai/voice',
  '/cli',
];

function extractRoutes(fileContent) {
  const pathRegex = /path="([^"]+)"/g;
  const routes = new Set();
  let match;
  while ((match = pathRegex.exec(fileContent)) !== null) {
    let p = match[1];
    if (!p.startsWith('/')) p = '/' + p;
    // Skip dynamic segments and duplicates
    if (p.includes(':')) continue;
    routes.add(p);
  }
  return Array.from(routes);
}

function isPublicRoute(path) {
  return !DISALLOWED_PATHS.some(dis => path === dis || path.startsWith(dis + '/'));
}

function generateSitemapXml(paths) {
  const DATE = new Date().toISOString();
  const urls = paths.map(p => {
    const loc = `${BASE_URL}${p === '/' ? '' : p}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${p === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function main() {
  const source = readFileSync(APP_FILE, 'utf8');
  const allRoutes = extractRoutes(source);
  const publicRoutes = allRoutes.filter(isPublicRoute);

  const xml = generateSitemapXml(publicRoutes);

  // Write routes.json for prerendering stubs
  const routesJsonPath = join(process.cwd(), 'scripts', 'routes.json');
  if (!existsSync(join(process.cwd(), 'scripts'))) mkdirSync(join(process.cwd(), 'scripts'));
  writeFileSync(routesJsonPath, JSON.stringify(publicRoutes, null, 2), 'utf8');

  const publicDir = join(process.cwd(), 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  const target = join(publicDir, 'sitemap.xml');
  writeFileSync(target, xml, 'utf8');
  console.log(`🗺️  Sitemap generated with ${publicRoutes.length} routes -> ${target}`);
}

main(); 