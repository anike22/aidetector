import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const xml = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url]) => url);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const robots = await readFile('dist/robots.txt', 'utf8');
assert(robots.includes('Sitemap: https://www.aidetector.cx/sitemap-index.xml'), 'robots.txt must advertise the full sitemap index');
const sitemapIndex = await readFile('dist/sitemap-index.xml', 'utf8');
for (const file of ['sitemap.xml', 'sitemap-guides.xml', 'sitemap-research.xml', 'sitemap-comparisons.xml', 'sitemap-blog.xml']) {
  assert(sitemapIndex.includes(`<loc>https://www.aidetector.cx/${file}</loc>`), `Missing sitemap index entry: ${file}`);
  await readFile(path.join('dist', file), 'utf8');
}
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
for (const [oldPath, newPath] of [['/video-detector', '/ai-video-detector'], ['/image-detector', '/ai-image-detector']]) {
  assert(config.redirects?.some(r => r.source === oldPath && r.destination === newPath && r.permanent === true), `Missing permanent redirect ${oldPath}`);
}
// Guard against soft-404 regressions without disabling legitimate feature-controlled pages.
assert(!config.rewrites.some(r => r.source.includes('((?!assets/')), 'Blanket SPA rewrite can cause soft 404s');
for (const route of ['/technical-seo', '/services/growth-marketing', '/seo-assistant']) {
  assert(config.rewrites.some(r => r.source === route), `Missing registered feature route: ${route}`);
}
assert(config.rewrites.some(r => r.source === '/tools/:id'), 'Missing dynamic tool route');
assert(config.rewrites.some(r => r.source === '/blog/:slug'), 'Missing dynamic article route');
assert(!config.rewrites.some(r => r.source === '/:hub/:slug'), 'Generic article hub rewrite is too broad');

for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.aidetector.cx');
  assert(!/^\/(admin|account|dashboard|essay-studio|login|signup|register|content-studio)(\/|$)/.test(parsed.pathname));
  const rewrite = config.rewrites.find(r => r.source === parsed.pathname);
  assert(rewrite, `Missing rewrite: ${url}`);
  const html = await readFile(path.join('dist', rewrite.destination), 'utf8');
  assert.equal((html.match(/<title>/g) || []).length, 1, `Duplicate title: ${url}`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `Duplicate canonical: ${url}`);
  assert(html.includes(`href="${url}"`), `Wrong canonical: ${url}`);
  assert(/<h1\b/.test(html), `Missing heading: ${url}`);
  assert(/name="description"/.test(html), `Missing description: ${url}`);
  if (['/', '/ai-image-detector', '/ai-video-detector', '/plagiarism-checker', '/ai-checker-for-bloggers'].includes(parsed.pathname)) {
    assert(!html.includes('Explore AIDetector.cx tools, guidance and resources for content integrity.'), `Generic SEO description: ${url}`);
  }
  if (parsed.pathname === '/ai-checker-for-bloggers') {
    assert(html.includes('<title>AI Checker for Bloggers: Scan &amp; Optimize Content for SEO</title>') || html.includes('<title>AI Checker for Bloggers: Scan & Optimize Content for SEO</title>'), 'Incorrect Bloggers SEO title');
    assert(html.includes('Scan, detect, and fully optimize your blog posts for SEO in one click.'), 'Missing Bloggers SEO description');
  }
  assert(!/name="robots"[^>]*noindex/.test(html), `Noindex: ${url}`);
  assert(!/pagead2\.googlesyndication\.com/.test(html), `Global ad script: ${url}`);
}
assert.equal(await readFile('dist/index.html', 'utf8'), await readFile('dist/prerender/home/index.html', 'utf8'), 'Root entry must contain rendered homepage');
console.log(`Verified initial HTML, canonicals and rewrites for ${urls.length} public pages.`);
