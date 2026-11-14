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
assert(urls.includes('https://www.aidetector.cx/login'), 'Login page missing from public sitemap');
assert(config.rewrites.some(r => r.source === '/login' && r.destination === '/prerender/login/index.html'), 'Login page missing dedicated prerender');
assert(!config.headers.some(h => ['/login', '/login/:path*'].includes(h.source) && h.headers?.some(v => v.key === 'X-Robots-Tag' && v.value.includes('noindex'))), 'Login page must not receive an HTTP noindex header');
assert(urls.includes('https://www.aidetector.cx/reports/shared'), 'Shared reports feature page missing from sitemap');
assert(config.rewrites.some(r => r.source === '/reports/shared' && r.destination === '/prerender/reports/shared/index.html'), 'Shared reports page missing dedicated prerender');
assert(config.headers.some(h => h.source === '/reports/:reportId/collaborate' && h.headers?.some(v => v.key === 'X-Robots-Tag' && v.value.includes('noindex'))), 'Individual collaboration reports must remain noindex');
for (const [oldPath, newPath] of [['/video-detector', '/ai-video-detector'], ['/image-detector', '/ai-image-detector']]) {
  assert(config.redirects?.some(r => r.source === oldPath && r.destination === newPath && r.permanent === true), `Missing permanent redirect ${oldPath}`);
}
// Old video-study links must permanently redirect to the registered canonical destinations.
for (const [oldPath, newPath] of [
  ['/content-hub', '/research'],
  ['/guides/authentic-video-false-positives', '/studies/authentic-video-false-positives'],
]) {
  assert(config.redirects?.some(r => r.source === oldPath && r.destination === newPath && r.permanent === true), `Missing canonical redirect: ${oldPath}`);
  assert(!urls.includes('https://www.aidetector.cx' + oldPath), `Legacy URL must not be in sitemap: ${oldPath}`);
  assert(urls.includes('https://www.aidetector.cx' + newPath), `Canonical destination missing from sitemap: ${newPath}`);
  assert(!config.rewrites.some(r => r.source === oldPath), `Legacy redirect must not serve a 200 rewrite: ${oldPath}`);
}
// Guard against soft-404 regressions without disabling legitimate feature-controlled pages.
assert(!config.rewrites.some(r => r.source.includes('((?!assets/')), 'Blanket SPA rewrite can cause soft 404s');
// Unknown URLs must receive Vercel's static HTTP 404 page instead of the homepage shell.
const notFoundHtml = await readFile('dist/404.html', 'utf8');
assert(/<title>Page Not Found \| AIDetector\.cx<\/title>/.test(notFoundHtml), 'Missing branded static 404 page');
assert(/<h1[^>]*>Page not found<\/h1>/i.test(notFoundHtml), 'Static 404 page must have a clear heading');
assert(/name="robots" content="noindex, nofollow"/.test(notFoundHtml), 'Static 404 page must be noindex');
assert(!config.rewrites.some(r => r.source === '/essay-template/:slug'), 'Unpublished Essay Template detail route must not rewrite to the SPA');
assert(!config.rewrites.some(r => r.source === '/marketplace/:id'), 'Feature-gated Marketplace detail route must not rewrite to the SPA');
for (const route of ['/marketplace', '/services/growth-marketing']) {
  assert(!config.rewrites.some(r => r.source === route), `Unpublished feature-gated route must return Vercel HTTP 404: ${route}`);
}
assert(!config.rewrites.some(r => r.source === '/:hub/:slug'), 'Generic article hub rewrite is too broad');
for (const source of ['/essay-template/:path*', '/services/growth-marketing', '/marketplace', '/marketplace/:path*']) {
  assert(config.headers.some(h => h.source === source && h.headers?.some(v => v.key === 'X-Robots-Tag' && v.value === 'noindex, follow')), `Missing unpublished-route noindex protection: ${source}`);
}

for (const route of ['/technical-seo', '/seo-assistant', '/essay-studio/:essayId', '/essay-studio/:essayId/:phase', '/prospecting/projects/:projectId/companies']) {
  assert(config.rewrites.some(r => r.source === route), `Missing registered application route: ${route}`);
}
assert(config.rewrites.some(r => r.source === '/tools/ollama'), 'Missing valid tool directory route');
assert(config.rewrites.some(r => r.source === '/ai-tools/ollama'), 'Missing valid tool alias route');
assert(!config.rewrites.some(r => ['/tools/:id', '/ai-tools/:id'].includes(r.source)), 'Generic tool routes can cause soft 404s');
assert(!config.rewrites.some(r => r.source === '/tools/nonexistent-tool-seo-test'), 'Unknown tool unexpectedly routed');
assert(!config.rewrites.some(r => ['/blog/:slug', '/guides/:slug', '/research/:slug', '/comparisons/:slug'].includes(r.source)), 'Unpublished or nonexistent articles must not return the generic SPA shell');
assert(!config.rewrites.some(r => r.source === '/:hub/:slug'), 'Generic article hub rewrite is too broad');

assert(urls.includes('https://www.aidetector.cx/aeo-optimizer'), 'AEO Optimizer missing from sitemap');
for (const route of ['/research/ai-detection-accuracy-tests', '/research/gpt-5-vs-gemini-detection', '/comparisons/turnitin-vs-aidetector-cx', '/comparisons/chatgpt-detector-comparison', '/guides/best-ai-detector']) {
  assert(urls.includes(`https://www.aidetector.cx${route}`), `Known indexed-content candidate missing: ${route}`);
  assert(config.rewrites.some(r => r.source === route && r.destination === `/prerender${route}/index.html`), `Known content must have its own prerender: ${route}`);
}
for (const pathname of ['/essay-studio', '/essay-studio/templates', '/reports/shared', '/login']) {
  const url = 'https://www.aidetector.cx' + pathname;
  assert(urls.includes(url), `Public Essay Studio page missing from sitemap: ${pathname}`);
  const rewrite = config.rewrites.find(entry => entry.source === pathname && entry.destination === `/prerender${pathname}/index.html`);
  assert(rewrite, `Missing dedicated Essay Studio prerender rewrite: ${pathname}`);
  const html = await readFile(path.join('dist', rewrite.destination), 'utf8');
  assert(/<h1\b/.test(html), `Missing rendered Essay Studio heading: ${pathname}`);
  assert(!/name="robots"[^>]*noindex/.test(html), `Public Essay Studio page is noindex: ${pathname}`);
  if (pathname.startsWith('/essay-studio')) assert(html.includes('Essay Studio') || html.includes('Essay Templates'), `Wrong prerender content for ${pathname}`);
  if (pathname === '/reports/shared') assert(html.includes('Shared AI Detection Reports') && html.includes('Sign in to access your shared reports'), 'Shared reports prerender must expose public feature copy without private report data');
  if (pathname === '/login') assert(html.includes('Sign in to AIDetector.cx') && html.includes('Log In to AIDetector.cx'), 'Login prerender must expose its public heading and specific metadata');
}

for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.aidetector.cx');
  assert(!/^\/(admin|account|dashboard|essay-studio\/|signup|register|content-studio)(\/|$)/.test(parsed.pathname));
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
  if (parsed.pathname === '/seo-assistant') {
    assert(html.includes('SEO Writing Assistant'), 'SEO Assistant must expose a specific SEO title');
    assert(html.includes('Review keyword usage, readability, headings and content integrity'), 'Missing SEO Assistant description');
    assert(!html.includes('SEO Assistant. Explore AIDetector.cx tools, guidance and resources for content integrity.'), 'Generic SEO Assistant metadata');
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
// Guard internal links in the AI video study cluster against reintroducing nonexistent destinations.
const videoStudyLinks = [
  ['src/pages/ai-video-detector/AIVideoDetectorPage.tsx', 'to="/studies/authentic-video-false-positives"', 'to="/guides/authentic-video-false-positives"'],
  ['src/pages/blog/AuthenticVideoFalsePositiveGuidePage.tsx', 'to="/research"', 'to="/content-hub"'],
  ['src/pages/blog/WhatsAppCompressionAIDetectionPage.tsx', 'to="/research"', 'to="/content-hub"'],
  ['src/pages/blog/WhyTikTokFlaggedMyRealVideoPage.tsx', 'to="/research"', 'to="/content-hub"'],
];
for (const [file, expected, broken] of videoStudyLinks) {
  const source = await readFile(file, 'utf8');
  assert(source.includes(expected), `Missing valid study-cluster link in ${file}: ${expected}`);
  assert(!source.includes(broken), `Broken study-cluster link returned in ${file}: ${broken}`);
}
for (const pathname of ['/research', '/studies/authentic-video-false-positives']) {
  assert(urls.includes('https://www.aidetector.cx' + pathname), `Study-cluster destination missing from sitemap: ${pathname}`);
  const rewrite = config.rewrites.find(r => r.source === pathname && r.destination === `/prerender${pathname}/index.html`);
  assert(rewrite, `Study-cluster destination missing dedicated prerender: ${pathname}`);
  await readFile(path.join('dist', rewrite.destination), 'utf8');
}

console.log(`Verified initial HTML, canonicals and rewrites for ${urls.length} public pages.`);
