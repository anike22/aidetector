// SEO-only HTTP fallback for paths not explicitly registered in vercel.json.
// Do not return the SPA homepage for nonexistent URLs: that produces soft 404s.
export default function handler(_request, response) {
  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('X-Robots-Tag', 'noindex, follow');
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>Page Not Found (404) | AIDetector.cx</title></head><body><main><h1>Page not found</h1><p>This page does not exist on AIDetector.cx.</p><p><a href="/">Home</a> · <a href="/guides">Guides</a></p></main></body></html>`);
}
