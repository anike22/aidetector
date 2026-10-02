import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.aidetector.cx';
for (const name of ['.env.local', '.env']) {
  try { process.loadEnvFile(path.join(root, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
// Explicit editorial inventory: routing's `public` flag also includes account workspaces.
export const publicPaths = ['/', '/detector', '/humanizer', '/word-counter', '/ai-summarizer', '/ai-image-detector', '/ai-video-detector', '/plagiarism-checker', '/ai-checker-for-bloggers', '/seo-assistant', '/tools', '/blog', '/guides', '/research', '/comparisons', '/about', '/contact', '/privacy', '/terms', '/cookies', '/pricing', '/chrome-extension', '/wordpress-plugin', '/affiliate-hub', '/authorship', '/api', '/api/docs', '/studies/why-tiktok-flagged-my-real-video', '/studies/whatsapp-compression-ai-video', '/studies/authentic-video-false-positives'];
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
  config.rewrites = [...paths].sort().map(p => ({source: p, destination: `/prerender${p === '/' ? '/home' : p}/index.html`}));
  config.rewrites.push({source: '/((?!assets/|.*\\.[^/]+$).*)', destination: '/index.html'});
  config.headers = [{source: '/:path*', headers: [{key: 'X-Content-Type-Options', value: 'nosniff'}]}, ...['admin','dashboard','account','settings','essay-studio','content-studio','organizations','workspaces','reports','prospecting','api/dashboard','authorship/dashboard','humanizer/history','login','signup','register','reset-password','payment-success','payment-cancel'].map(p => ({source: `/${p}/:path*`, headers: [{key: 'X-Robots-Tag', value: 'noindex, follow'}]}))];
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  return [...paths];
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepare();
