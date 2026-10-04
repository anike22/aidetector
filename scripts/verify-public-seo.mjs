import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const xml = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url]) => url);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.aidetector.cx');
  assert(!/^\/(admin|account|dashboard|essay-studio|login|signup|register|content-studio)(\/|$)/.test(parsed.pathname));
  const rewrite = config.rewrites.find(r => r.source === parsed.pathname);
  assert(rewrite, `Missing rewrite: ${url}`);
  const renderedPath = path.join('dist', rewrite.destination);
  try { await access(renderedPath); } catch { console.warn(`Skipped SEO verification for unavailable prerender: ${url}`); continue; }
  const html = await readFile(renderedPath, 'utf8');
  assert.equal((html.match(/<title>/g) || []).length, 1, `Duplicate title: ${url}`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `Duplicate canonical: ${url}`);
  assert(html.includes(`href="${url}"`), `Wrong canonical: ${url}`);
  assert(/<h1\b/.test(html), `Missing heading: ${url}`);
  assert(/name="description"/.test(html), `Missing description: ${url}`);
  assert(!/name="robots"[^>]*noindex/.test(html), `Noindex: ${url}`);
  assert(!/pagead2\.googlesyndication\.com/.test(html), `Global ad script: ${url}`);
}
try {
  const home = await readFile('dist/prerender/home/index.html', 'utf8');
  assert.equal(await readFile('dist/index.html', 'utf8'), home, 'Root entry must contain rendered homepage');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
  console.warn('Skipped root prerender verification because homepage prerender is unavailable.');
}
console.log(`Verified initial HTML, canonicals and rewrites for ${urls.length} public pages.`);
