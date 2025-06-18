/* eslint-disable no-console */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Base URL of deployed GitHub Pages site (without trailing slash)
const BASE_URL = 'https://www.labnex.dev';

// Public routes to include in the sitemap
const routes = [
  '/',
  '/login',
  '/register',
  '/changelog',
  '/privacy-policy',
  '/terms-of-service',
  '/support',
  '/features/project-management',
  '/features/test-case-management',
  '/features/notes-and-snippets',
  '/features/modern-development-platform',
  '/features/discord-ai-integration',
  '/features/cli-automation',
  '/features/tech-stack',
  '/roadmap',
  '/donation/thank-you',
];

const DATE = new Date().toISOString();

function generateUrlXml(path) {
  const loc = `${BASE_URL}${path === '/' ? '' : path}`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
}

function generateSitemap() {
  const urlsXml = routes.map(generateUrlXml).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlsXml}\n` +
    `</urlset>`;
}

function main() {
  const outputDir = join(process.cwd(), 'public'); // frontend/public
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  const filePath = join(outputDir, 'sitemap.xml');
  const xml = generateSitemap();
  writeFileSync(filePath, xml, 'utf8');
  console.log(`✅ Sitemap generated at ${filePath}`);
}

main(); 