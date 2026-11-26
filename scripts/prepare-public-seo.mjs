import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://aidetector.cx';
for (const name of ['.env.local', '.env']) {
  try { process.loadEnvFile(path.join(root, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
// Explicit editorial inventory: routing's `public` flag also includes account workspaces.
export const publicPaths = ['/', '/embed', '/detector', '/humanizer', '/word-counter', '/grammar-checker', '/ai-summarizer', '/ai-image-detector', '/ai-video-detector', '/video-detector', '/sell', '/plagiarism-checker', '/ai-checker-for-bloggers', '/seo-assistant', '/aeo-optimizer', '/tools', '/blog', '/guides', '/research', '/comparisons', '/about', '/contact', '/privacy', '/terms', '/cookies', '/pricing', '/chrome-extension', '/wordpress-plugin', '/affiliate-hub', '/affiliate-agreement', '/authorship', '/api', '/api/docs', '/essay-studio', '/essay-studio/templates', '/reports/shared', '/login', '/services', '/sitemap', '/studies/why-tiktok-flagged-my-real-video', '/studies/whatsapp-compression-ai-video', '/studies/authentic-video-false-positives', '/guides/understanding-ai-detection-scores', '/guides/best-practices-for-educators', '/research/dual-engine-detection-methodology', '/research/language-benchmark-overview'];
export async function prepare() {
  const maps = ['sitemap-guides.xml', 'sitemap-research.xml', 'sitemap-comparisons.xml', 'sitemap-blog.xml'];
  const configPath = path.join(root, 'vercel.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const seoRedirects = [
    {source: '/all-pages', destination: '/sitemap', permanent: true},
    {source: '/directory', destination: '/sitemap', permanent: true},
    {source: '/ai-detection-accuracy-tests', destination: '/research/ai-detection-accuracy-tests', permanent: true},
    {source: '/image-detector', destination: '/ai-image-detector', permanent: true},
  ];
  const redirects = [...seoRedirects, ...(config.redirects || []).filter(r => !seoRedirects.some(s => s.source === r.source))];
  const redirectSources = new Set(redirects.map(({source}) => source));
  const normalizePath = pathname => pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  const normalizeSitemapXml = source => source
    .replace(/<url\b[\s\S]*?<\/url>/g, block => {
      const match = block.match(/<loc>(.*?)<\/loc>/);
      if (!match) return block;
      const parsed = new URL(match[1]);
      const pathname = normalizePath(parsed.pathname);
      return redirectSources.has(pathname) ? '' : block;
    })
    .replace(/<loc>(.*?)<\/loc>/g, (_, loc) => {
      const parsed = new URL(loc);
      parsed.protocol = 'https:';
      parsed.hostname = 'aidetector.cx';
      parsed.port = '';
      parsed.pathname = normalizePath(parsed.pathname);
      return `<loc>${parsed.href}</loc>`;
    });
  const paths = new Set(publicPaths.map(normalizePath).filter(p => !redirectSources.has(p)));
  for (const name of maps) {
    const xml = await readFile(path.join(root, 'public', name), 'utf8');
    for (const [, url] of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const pathname = normalizePath(new URL(url).pathname);
      if (!redirectSources.has(pathname)) paths.add(pathname);
    }
  }
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    const url = new URL('/rest/v1/blog_posts', process.env.VITE_SUPABASE_URL);
    url.search = 'select=slug,hub&status=eq.published';
    const response = await fetch(url, {headers: {apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`}, signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`Published article discovery failed: HTTP ${response.status}`);
    for (const article of await response.json()) {
      if (['blog', 'guides', 'research', 'comparisons'].includes(article.hub) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
        const pathname = normalizePath(`/${article.hub}/${article.slug}`);
        if (!redirectSources.has(pathname)) paths.add(pathname);
      }
    }
  }
  const canonicalPaths = [...paths].filter(p => !redirectSources.has(p)).sort();
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + canonicalPaths.map(p => `  <url><loc>${origin}${p}</loc></url>`).join('\n') + '\n</urlset>\n';
  await writeFile(path.join(root, 'public/sitemap.xml'), xml);
  for (const name of [...maps, 'sitemap-index.xml']) {
    let xml = await readFile(path.join(root, 'public', name), 'utf8');
    xml = normalizeSitemapXml(xml).replace(/\s*<lastmod>.*?<\/lastmod>/g, '');
    await writeFile(path.join(root, 'public', name), xml);
  }
  // Vercel deploys the checked-in routing file; the generated build config alone
  // cannot establish that public canonical URLs serve their prerendered HTML.
  // Catch omissions in the explicit editorial inventory before this script overwrites vercel.json.
  // Sitemap-discovered articles/guides are intentionally generated below and need not be checked in.
  for (const pathname of publicPaths) {
    const expected = `/prerender${pathname === '/' ? '/home' : pathname}/index.html`;
    assertCheckedInPublicRewrite(pathname, expected);
  }
  function assertCheckedInPublicRewrite(pathname, expected) {
    if (!config.rewrites?.some(route => route.source === pathname && route.destination === expected)) {
      throw new Error(`Checked-in vercel.json missing public prerender rewrite: ${pathname} -> ${expected}`);
    }
  }
  // Preserve established legacy detector URLs with permanent server redirects for crawlers.
  config.redirects = redirects;
  config.rewrites = canonicalPaths.map(p => ({source: p, destination: `/prerender${p === '/' ? '/home' : p}/index.html`}));
  config.rewrites.push({source: '/embed/widget', destination: '/index.html'});
  // Keep valid feature-controlled, account, and dynamic SPA routes. Unknown URLs fall through to HTTP 404. Public Essay Studio landing/template routes are prerendered; private essay records retain client noindex metadata.
  const routeSource = await readFile(path.join(root, 'src/routes.tsx'), 'utf8');
  const registeredRoutes = [...routeSource.matchAll(/path: *['"]([^'"]+)['"]/g)].map(([, route]) => route);
  if (registeredRoutes.length < 150 || !registeredRoutes.includes('/technical-seo') || !registeredRoutes.includes('/services/growth-marketing')) {
    throw new Error('Route inventory incomplete; refusing to alter unknown URL routing');
  }
  // Generate exact server routes from the same static directory dataset used by the UI.
  // A wildcard /tools/:id returns HTTP 200 for nonexistent records (soft 404).
  const directorySource = await readFile(path.join(root, 'src/data/aiDirectoryData.ts'), 'utf8');
  const directoryIds = [...directorySource.matchAll(/^    (?:id|slug): '([a-z0-9-]+)'/gm)].map(([, id]) => id);
  const knownDirectoryIds = [...new Set(directoryIds)];
  if (knownDirectoryIds.length < 10) throw new Error('AI directory inventory incomplete; refusing to change tool routes');
  for (const id of knownDirectoryIds) {
    for (const prefix of ['/tools', '/ai-tools']) {
      config.rewrites.push({source: `${prefix}/${id}`, destination: '/index.html'});
    }
  }
  const redirectSources = new Set((config.redirects || []).map(({source}) => source));
  for (const route of registeredRoutes) {
    // A permanent redirect must win over any stale or accidentally reintroduced SPA route.
    if (redirectSources.has(route)) continue;
    // The article route is intentionally broad in React; narrow the server match to real content hubs.
    if (route === '/tools/:id' || route === '/ai-tools/:id') {
      // Exact directory routes were generated above; unknown IDs must be HTTP 404.
      continue;
    }
    if (route === '/essay-template/:slug' || route === '/marketplace/:id' || route === '/marketplace' || route === '/services/growth-marketing') {
      // These routes are unpublished or feature-gated. Do not send them to the homepage SPA shell;
      // let Vercel return the branded static HTTP 404 until the routes are intentionally published.
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
  // Exact paths protect root-level private pages even when a catch-all parameter does not match an empty suffix.
  const privateExactPaths = ['/technical-seo'];
  const unpublishedNoindexPaths = ['/essay-template/:path*', '/services/growth-marketing', '/marketplace', '/marketplace/:path*'];
  config.headers = [{source: '/embed/widget', headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]}, {source: '/:path*', headers: [{key: 'X-Content-Type-Options', value: 'nosniff'}]}, ...privateExactPaths.map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), ...unpublishedNoindexPaths.map(source => ({source, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), ...['admin','dashboard','account','settings','content-studio','organizations','workspaces','prospecting','api/dashboard','authorship/dashboard','humanizer/history','signup','register','reset-password','payment-success','payment-cancel'].map(p => ({source: `/${p}/:path*`, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]})), {source: '/reports/:reportId/collaborate', headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]}];
  for (const source of unpublishedNoindexPaths) {
    if (!config.headers.some(h => h.source === source && h.headers?.some(x => x.key === 'X-Robots-Tag' && x.value === 'noindex, follow'))) throw new Error(`Missing unpublished-route noindex header: ${source}`);
  }
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  return [...paths];
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepare();
