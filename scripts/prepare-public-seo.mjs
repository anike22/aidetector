import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.aidetector.cx';
for (const name of ['.env.local', '.env']) {
  try { process.loadEnvFile(path.join(root, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
// Explicit editorial inventory: routing's `public` flag also includes account workspaces.
export const publicPaths = ['/', '/detector', '/humanizer', '/word-counter', '/ai-summarizer', '/ai-image-detector', '/ai-video-detector', '/plagiarism-checker', '/ai-checker-for-bloggers', '/seo-assistant', '/aeo-optimizer', '/tools', '/blog', '/guides', '/research', '/comparisons', '/about', '/contact', '/privacy', '/terms', '/cookies', '/pricing', '/chrome-extension', '/wordpress-plugin', '/affiliate-hub', '/affiliate-agreement', '/authorship', '/api', '/api/docs', '/studies/why-tiktok-flagged-my-real-video', '/studies/whatsapp-compression-ai-video', '/studies/authentic-video-false-positives'];
export async function prepare() {
  const maps = ['sitemap-guides.xml', 'sitemap-research.xml', 'sitemap-comparisons.xml', 'sitemap-blog.xml'];
  const paths = new Set(publicPaths);
  for (const name of maps) {
    const xml = await readFile(path.join(root, 'public', name), 'utf8');
    for (const [, url] of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const pathname = new URL(url).pathname;
      if (pathname !== '/guides/understanding-ai-detection-scores') paths.add(pathname);
    }
  }
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    const url = new URL('/rest/v1/blog_posts', process.env.VITE_SUPABASE_URL);
    url.search = 'select=slug,hub&status=eq.published';
    const response = await fetch(url, {headers: {apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`}, signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`Published article discovery failed: HTTP ${response.status}`);
    for (const article of await response.json()) {
      if (['blog', 'guides', 'research', 'comparisons'].includes(article.hub) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) paths.add(`/${article.hub}/${article.slug}`);
    }
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + [...paths].sort().map(p => `  <url><loc>${origin}${p}</loc></url>`).join('\n') + '\n</urlset>\n';
  await writeFile(path.join(root, 'public/sitemap.xml'), xml);
  for (const name of [...maps, 'sitemap-index.xml']) {
    let xml = await readFile(path.join(root, 'public', name), 'utf8');
    xml = xml.replaceAll('https://aidetector.cx', origin).replace(/\s*<lastmod>.*?<\/lastmod>/g, '');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/guides\/understanding-ai-detection-scores<\/loc>[\s\S]*?<\/url>/g, '');
    await writeFile(path.join(root, 'public', name), xml);
  }
  const configPath = path.join(root, 'vercel.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const checkedInRewrites = config.rewrites || [];
  // Vercel can use checked-in routes before build-time generation. Ensure every
  // static public canonical route resolves to its prerendered HTML in both configs.
  for (const pathname of publicPaths) {
    const expected = `/prerender${pathname === '/' ? '/home' : pathname}/index.html`;
    if (!config.rewrites?.some(route => route.source === pathname && route.destination === expected)) {
      throw new Error(`Checked-in vercel.json missing public prerender rewrite: ${pathname} -> ${expected}`);
    }
  }
  // Preserve established legacy detector URLs with permanent server redirects for crawlers.
  const seoRedirects = [
    {source: '/video-detector', destination: '/ai-video-detector', permanent: true},
    {source: '/image-detector', destination: '/ai-image-detector', permanent: true},
    // Google reported this client-only redirect as a soft 404; make it an HTTP redirect.
    {source: '/guides/understanding-ai-detection-scores', destination: '/guides/how-ai-detection-works', permanent: true},
  ];
  config.redirects = [
    ...seoRedirects,
    ...(config.redirects || []).filter(r => !seoRedirects.some(s => s.source === r.source)),
  ];
  config.rewrites = [...paths].sort().map(p => ({source: p, destination: `/prerender${p === '/' ? '/home' : p}/index.html`}));
  // Keep valid feature-controlled, account, and dynamic SPA routes. Unknown URLs fall through to HTTP 404.
  const routeSource = await readFile(path.join(root, 'src/routes.tsx'), 'utf8');
  const registeredRoutes = [...routeSource.matchAll(/path: *['"]([^'"]+)['"]/g)].map(([, route]) => route);
  if (registeredRoutes.length < 150 || !registeredRoutes.includes('/technical-seo') || !registeredRoutes.includes('/services/growth-marketing')) {
    throw new Error('Route inventory incomplete; refusing to alter unknown URL routing');
  }
  // Checked-in routing is what Vercel may deploy before this script regenerates
  // rewrites. Every registered SPA route must survive the unknown-URL 404 guard.
  const excludedBroadRoutes = new Set(['/tools/:id', '/ai-tools/:id', '/:hub/:slug']);
  // A registered React alias can intentionally be served by an HTTP redirect,
  // rather than a rewrite (for example /api-platform -> /api).
  const permanentRedirectSources = new Set(config.redirects.filter(r => r.permanent === true).map(r => r.source));
  for (const route of registeredRoutes) {
    if (excludedBroadRoutes.has(route) || route === '/marketplace/:id' || permanentRedirectSources.has(route)) continue;
    const match = checkedInRewrites.find(rewrite => rewrite.source === route);
    if (!match || match.destination === '/api/seo-not-found') {
      throw new Error(`Checked-in Vercel config does not preserve registered route: ${route}`);
    }
  }
  const checkedInFallback = checkedInRewrites.at(-1);
  if (checkedInFallback?.source !== '/(.*)' || checkedInFallback.destination !== '/api/seo-not-found') {
    throw new Error('Checked-in Vercel fallback must return genuine HTTP 404 for unknown URLs');
  }
  // Generate exact server routes from the same static directory dataset used by the UI.
  // A wildcard /tools/:id returns HTTP 200 for nonexistent records (soft 404).
  const directorySource = await readFile(path.join(root, 'src/data/aiDirectoryData.ts'), 'utf8');
  const directoryIds = [...directorySource.matchAll(/^    (?:id|slug): '([a-z0-9-]+)'/gm)].map(([, id]) => id);
  const knownDirectoryIds = [...new Set(directoryIds)];
  if (knownDirectoryIds.length < 10) throw new Error('AI directory inventory incomplete; refusing to change tool routes');
  // Vercel may load checked-in rewrites before this script runs. Protect real
  // directory detail routes and reject unknown IDs in the deployed config too.
  for (const prefix of ['/tools', '/ai-tools']) {
    const unknownIndex = checkedInRewrites.findIndex(r => r.source === `${prefix}/:id` && r.destination === '/api/seo-not-found');
    if (unknownIndex < 0) throw new Error(`Checked-in Vercel config must 404 unknown ${prefix} IDs`);
    for (const id of knownDirectoryIds) {
      const knownIndex = checkedInRewrites.findIndex(r => r.source === `${prefix}/${id}` && r.destination === '/index.html');
      if (knownIndex < 0 || knownIndex >= unknownIndex) {
        throw new Error(`Checked-in Vercel config must preserve known directory route: ${prefix}/${id}`);
      }
    }
  }
  // Marketplace detail records are static, not database-backed. Reject missing IDs.
  const marketplaceSource = await readFile(path.join(root, 'src/data/siteData.ts'), 'utf8');
  const marketplaceBlock = marketplaceSource.split('export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [')[1]?.split('];')[0];
  if (!marketplaceBlock) throw new Error('Marketplace product inventory missing');
  const marketplaceIds = [...marketplaceBlock.matchAll(/^\s+id: '([a-z0-9-]+)',/gm)].map(([, id]) => id);
  if (marketplaceIds.length < 4 || new Set(marketplaceIds).size !== marketplaceIds.length) {
    throw new Error('Marketplace product inventory incomplete or duplicate');
  }
  const marketplaceUnknownIndex = checkedInRewrites.findIndex(r => r.source === '/marketplace/:id' && r.destination === '/api/seo-not-found');
  if (marketplaceUnknownIndex < 0) throw new Error('Checked-in Vercel config must 404 unknown marketplace IDs');
  for (const id of marketplaceIds) {
    const knownIndex = checkedInRewrites.findIndex(r => r.source === `/marketplace/${id}` && r.destination === '/index.html');
    if (knownIndex < 0 || knownIndex >= marketplaceUnknownIndex) {
      throw new Error(`Checked-in Vercel config must preserve marketplace product ${id}`);
    }
    config.rewrites.push({source: `/marketplace/${id}`, destination: '/index.html'});
  }
  for (const id of knownDirectoryIds) {
    for (const prefix of ['/tools', '/ai-tools']) {
      config.rewrites.push({source: `${prefix}/${id}`, destination: '/index.html'});
    }
  }
  for (const route of registeredRoutes) {
    // The article route is intentionally broad in React; narrow the server match to real content hubs.
    // Server redirects must not also be served as generic 200 SPA pages.
    if (permanentRedirectSources.has(route)) continue;
    if (route === '/marketplace/:id') {
      // Exact product IDs above remain functional; reject missing IDs below.
      continue;
    }
    if (route === '/tools/:id' || route === '/ai-tools/:id') {
      // Exact directory routes were generated above; unknown IDs must be HTTP 404.
      continue;
    }
    if (route === '/:hub/:slug') {
      // Public articles are enumerated above from published content and prerendered.
      // Do not serve the generic SPA shell (HTTP 200) for arbitrary missing slugs:
      // that creates soft-404 and duplicate-canonical indexing problems.
      continue;
    } else if (!paths.has(route)) {
      config.rewrites.push({source: route, destination: '/index.html'});
    }
  }
  config.rewrites.push({source: '/marketplace/:id', destination: '/api/seo-not-found'});
  // Explicitly return 404 for verified missing URLs in the checked-in Vercel config too.
  // Vercel may read root vercel.json before the production build regenerates it.
  for (const source of ['/research/false-positive-analysis', '/research/language-benchmark-overview', '/tools/12']) {
    config.rewrites.push({source, destination: '/api/seo-not-found'});
  }
  // Published guides are enumerated in paths and prerendered; reject unknown guide slugs.
  config.rewrites.push({source: '/guides/:path*', destination: '/api/seo-not-found'});
  // The studies hub contains only explicitly prerendered public studies; reject unknown slugs.
  // This mirrors the checked-in Vercel routing so preview and build-time behavior agree.
  config.rewrites.push({source: '/studies/:path*', destination: '/api/seo-not-found'});
  // Vercel's Vite SPA fallback otherwise serves dist/index.html (HTTP 200) for unknown URLs.
  // Explicit routes above preserve registered pages; unmatched requests must reach a real 404 Function.
  config.rewrites.push({source: '/(.*)', destination: '/api/seo-not-found'});
  // Exact paths protect root-level private pages even when a catch-all parameter does not match an empty suffix.
  const privateExactPaths = ['/login', '/reports/shared'];
  // Growth Marketing is hidden and nonindexable by default; preserve SPA access but keep crawlers out until an intentional publication release.
  const hiddenCommercialRoutes = ['/services/growth-marketing'];
  for (const source of hiddenCommercialRoutes) {
    if (!config.headers?.some(entry => entry.source === source && entry.headers?.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex')))) {
      throw new Error(`Checked-in Vercel config missing hidden commercial route noindex: ${source}`);
    }
  }
  // User-specific humanizer job URLs must stay functional but never be indexed.
  const privateJobRoutes = ['/humanizer/processing/:jobId', '/humanizer/alternatives/:jobId', '/humanizer/result/:jobId'];
  for (const source of privateJobRoutes) {
    if (!config.headers?.some(entry => entry.source === source && entry.headers?.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex')))) {
      throw new Error(`Checked-in Vercel config missing private job noindex: ${source}`);
    }
  }
  config.headers = [{source: '/:path*', headers: [{key: 'X-Content-Type-Options', value: 'nosniff'}]}, ...privateExactPaths.map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), ...hiddenCommercialRoutes.map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), ...privateJobRoutes.map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), ...['admin','dashboard','account','settings','essay-studio','content-studio','organizations','workspaces','reports','prospecting','api/dashboard','authorship/dashboard','humanizer/history','login','signup','register','reset-password','payment-success','payment-cancel'].map(p => ({source: `/${p}/:path*`, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]}))];
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  return [...paths];
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepare();
