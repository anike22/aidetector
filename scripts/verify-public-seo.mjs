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
// Vercel serves dist/404.html with HTTP 404 for unmatched static routes.
// Without this file, Vite's SPA fallback may serve the homepage with HTTP 200,
// causing the soft-404 reports seen for nonexistent research and arbitrary URLs.
const notFoundHtml = await readFile('dist/404.html', 'utf8');
assert(notFoundHtml.includes('Page Not Found (404)'), 'Missing explicit 404 document');
assert(/name="robots"[^>]*content="noindex, follow"/.test(notFoundHtml), '404 document must not be indexed');
assert(!notFoundHtml.includes('rel="canonical"'), '404 document must not claim the homepage canonical');

for (const source of ['/login', '/reports/shared']) {
  assert(config.headers.some(h => h.source === source && h.headers?.some(v => v.key === 'X-Robots-Tag' && v.value.includes('noindex'))), `Missing HTTP noindex header for ${source}`);
  assert(!urls.includes(`https://www.aidetector.cx${source}`), `Private route in public sitemap: ${source}`);
}
for (const [oldPath, newPath] of [['/video-detector', '/ai-video-detector'], ['/image-detector', '/ai-image-detector'], ['/guides/understanding-ai-detection-scores', '/guides/how-ai-detection-works']]) {
  assert(config.redirects?.some(r => r.source === oldPath && r.destination === newPath && r.permanent === true), `Missing permanent redirect ${oldPath}`);
  assert(!config.rewrites.some(r => r.source === oldPath), `Redirect path must not be rewritten as an HTTP 200: ${oldPath}`);
  assert(!urls.includes(`https://www.aidetector.cx${oldPath}`), `Redirect path must not be in public sitemap: ${oldPath}`);
}
// Guard against soft-404 regressions without disabling legitimate feature-controlled pages.
assert(!config.rewrites.some(r => r.source.includes('((?!assets/')), 'Blanket SPA rewrite can cause soft 404s');
for (const route of ['/technical-seo', '/services/growth-marketing', '/seo-assistant']) {
  assert(config.rewrites.some(r => r.source === route), `Missing registered feature route: ${route}`);
}
assert(config.rewrites.some(r => r.source === '/tools/ollama'), 'Missing valid tool directory route');
assert(config.rewrites.some(r => r.source === '/ai-tools/ollama'), 'Missing valid tool alias route');
assert(!config.rewrites.some(r => ['/tools/:id', '/ai-tools/:id'].includes(r.source)), 'Generic tool routes can cause soft 404s');
assert(!config.rewrites.some(r => r.source === '/tools/nonexistent-tool-seo-test'), 'Unknown tool unexpectedly routed');
for (const excludedPath of ['/tools/12', '/research/language-benchmark-overview']) {
  assert(!urls.includes('https://www.aidetector.cx' + excludedPath), 'Historical excluded URL unexpectedly added to sitemap: ' + excludedPath);
  assert(!config.rewrites.some(route => route.source === excludedPath), 'Historical excluded URL unexpectedly mapped to a public page: ' + excludedPath);
}

assert(!config.rewrites.some(r => ['/blog/:slug', '/guides/:slug', '/research/:slug', '/comparisons/:slug'].includes(r.source)), 'Unpublished or nonexistent articles must not return the generic SPA shell');
assert(!config.rewrites.some(r => r.source === '/:hub/:slug'), 'Generic article hub rewrite is too broad');

assert(urls.includes('https://www.aidetector.cx/aeo-optimizer'), 'AEO Optimizer missing from sitemap');
for (const route of ['/research/ai-detection-accuracy-tests', '/research/gpt-5-vs-gemini-detection', '/comparisons/turnitin-vs-aidetector-cx', '/comparisons/chatgpt-detector-comparison', '/guides/best-ai-detector']) {
  assert(urls.includes(`https://www.aidetector.cx${route}`), `Known indexed-content candidate missing: ${route}`);
  assert(config.rewrites.some(r => r.source === route && r.destination === `/prerender${route}/index.html`), `Known content must have its own prerender: ${route}`);
}
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
// Explicitly check distinct metadata for public pages previously classified as duplicates.
const flaggedPaths = [
  '/research/ai-detection-accuracy-tests',
  '/research/gpt-5-vs-gemini-detection',
  '/comparisons/turnitin-vs-aidetector-cx',
  '/comparisons/chatgpt-detector-comparison',
];
const flaggedTitles = new Set();
const flaggedDescriptions = new Set();
for (const pathname of flaggedPaths) {
  const target = 'https://www.aidetector.cx' + pathname;
  assert(urls.includes(target), 'Known public article missing from sitemap: ' + pathname);
  const rewrite = config.rewrites.find(entry => entry.source === pathname);
  assert(rewrite && rewrite.destination.startsWith('/prerender/'), 'Missing article prerender: ' + pathname);
  const articleHtml = await readFile(path.join('dist', rewrite.destination), 'utf8');
  const title = articleHtml.split('<title>')[1]?.split('</title>')[0]?.trim();
  const description = articleHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)?.[1]?.trim()
    || articleHtml.match(/<meta[^>]*content="([^"]+)"[^>]*name="description"/)?.[1]?.trim();
  assert(title && title.length >= 25, 'Missing meaningful title: ' + pathname);
  assert(description && description.length >= 60, 'Missing meaningful description: ' + pathname);
  assert(!description.includes('Explore AIDetector.cx tools, guidance and resources for content integrity.'), 'Generic description: ' + pathname);
  assert(!flaggedTitles.has(title), 'Duplicate article title: ' + pathname);
  assert(!flaggedDescriptions.has(description), 'Duplicate article description: ' + pathname);
  flaggedTitles.add(title);
  flaggedDescriptions.add(description);
}

assert.equal(await readFile('dist/index.html', 'utf8'), await readFile('dist/prerender/home/index.html', 'utf8'), 'Root entry must contain rendered homepage');
console.log(`Verified initial HTML, canonicals and rewrites for ${urls.length} public pages.`);
