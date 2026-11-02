// Return a genuine HTTP 404 for a confirmed removed public URL.
export default function handler(_request, response) {
  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('X-Robots-Tag', 'noindex, follow');
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Page not found | AIDetector.cx</title></head><body><main><h1>Page not found</h1><p>This page does not exist on AIDetector.cx.</p><a href="/">Home</a></main></body></html>');
}
