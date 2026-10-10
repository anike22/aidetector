import { chromium } from 'playwright';
import serverChromium from '@sparticuz/chromium';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const dist = path.resolve('dist');
const xml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
const shell = await readFile(path.join(dist, 'index.html'));
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(dist, '.' + pathname);
  try {
    if (!file.startsWith(dist + path.sep)) throw new Error('Invalid path');
    const data = await readFile(file);
    const type = {'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)] || 'application/octet-stream';
    res.setHeader('Content-Type', type); res.end(data);
  } catch { res.setHeader('Content-Type', 'text/html'); res.end(shell); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({headless:true, executablePath:await serverChromium.executablePath(), args:serverChromium.args.filter(arg => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(arg))});
  async function createPrerenderContext() {
    const context = await browser.newContext();
    // No build-time visitors, lead submissions, usage deductions, ads or analytics.
    await context.route('**/*', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS' && new URL(request.url()).hostname.endsWith('.supabase.co')) {
        return route.fulfill({status:204, headers:{'access-control-allow-origin':'*', 'access-control-allow-methods':'GET, HEAD, OPTIONS', 'access-control-allow-headers':request.headers()['access-control-request-headers'] || '*'}});
      }
      if (!['GET','HEAD'].includes(request.method()) || /googlesyndication|google-analytics|doubleclick/.test(request.url())) return route.abort();
      if (new URL(request.url()).hostname.endsWith('.supabase.co')) {
        try {
          const response = await fetch(request.url(), {headers:request.headers(), signal:AbortSignal.timeout(15000)});
          return route.fulfill({status:response.status, contentType:response.headers.get('content-type') || 'application/json', headers:{'access-control-allow-origin':'*'}, body:Buffer.from(await response.arrayBuffer())});
        } catch {
          // Public prerender content must not depend on a slow external data request.
          return route.abort();
        }
      }
      return route.continue();
    });
    return context;
  }

  async function renderPage(pathname) {
    let context;
    let page;
    let lastError;
    let browserErrors = [];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        context = await createPrerenderContext();
        page = await context.newPage();
        browserErrors = [];
        page.on('pageerror', error => browserErrors.push(String(error).slice(0, 600)));
        page.on('console', message => {
          if (message.type() === 'error') browserErrors.push(message.text().slice(0, 600));
        });
        // Commit confirms the local route responded; the H1/content checks below prove the app rendered.
        await page.goto(origin + pathname, {waitUntil:'commit',timeout:45000});
        await page.waitForSelector('h1', {timeout:20000});
        lastError = null;
        break;
      } catch (error) {
        const bodyPreview = await page?.locator('body').innerText({timeout:1500}).catch(() => '') || '';
        const title = await page?.title().catch(() => '') || '';
        console.error('[prerender-debug]', JSON.stringify({
          path: pathname, attempt, error: String(error),
          url: page?.url(), title, bodyPreview: bodyPreview.slice(0, 450),
          browserErrors: browserErrors.slice(0, 8),
        }));
        lastError = error;
        await context?.close().catch(() => {});
        context = null;
        page = null;
      }
    }
    if (lastError || !page || !context) throw lastError || new Error('Unable to create prerender page');
    // Strict content checks below remain authoritative.
    if (new URL(page.url()).pathname !== pathname) throw new Error(`Redirected public page: ${pathname}`);
    const html = await page.evaluate(({pathname}) => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      if (!h1 || /not found|unavailable|something went wrong/i.test(h1) || (document.querySelector('#root')?.textContent?.trim().length || 0) < 300) throw new Error('Missing publisher content');
      if (/noindex/.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') || '')) throw new Error('Public page is noindex');
      const setMeta = (name, content) => {
        document.querySelectorAll(`meta[name="${name}"]`).forEach(el => el.remove());
        const el = document.createElement('meta'); el.name = name; el.content = content; document.head.append(el);
      };
      const titles = [...document.querySelectorAll('title')];
      let title = titles.at(-1)?.textContent;
      if (!title || (pathname !== '/' && title.includes('AI Detector – Detect ChatGPT'))) title = `${h1} | AIDetector.cx`;
      titles.forEach(el => el.remove()); const titleEl = document.createElement('title'); titleEl.textContent = title; document.head.append(titleEl);
      const description = [...document.querySelectorAll('meta[name="description"]')].at(-1)?.getAttribute('content') || `${h1}. Explore AIDetector.cx tools, guidance and resources for content integrity.`;
      setMeta('description', description);
      setMeta('robots', 'index, follow, max-image-preview:large');
      document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
      const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = 'https://www.aidetector.cx' + pathname; document.head.append(canonical);
      // Transient overlays do not belong in a saved anonymous page.
      document.querySelectorAll('[role="dialog"], [data-sonner-toaster]').forEach(el => el.remove());
      return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    }, {pathname});
    const directory = path.join(dist, 'prerender', pathname === '/' ? 'home' : pathname.slice(1));
    await mkdir(directory, {recursive:true});
    await writeFile(path.join(directory, 'index.html'), html);
    await context.close();
    console.log(`Prerendered ${pathname}`);
  }
  let next = 0;
  // Run one Chromium page at a time on Vercel's 2-core builder. Reliability is more important than parallelism here.
  await Promise.all(Array.from({length:1}, async () => {
    while (next < paths.length) {
      const pathname = paths[next++];
      try { await renderPage(pathname); } catch (error) { throw new Error(`Prerender failed for ${pathname}: ${error.message}`, {cause:error}); }
    }
  }));
  // Vercel serves the physical root index before rewrites.
  await writeFile(path.join(dist, 'index.html'), await readFile(path.join(dist, 'prerender/home/index.html')));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
