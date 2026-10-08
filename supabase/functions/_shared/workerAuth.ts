// Background workers accept only server-side credentials, never user JWTs or publishable keys.
export function authorizeWorker(req: Request): Response | null {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const expected = Deno.env.get('BACKGROUND_WORKER_TOKEN');
  const provided = req.headers.get('x-background-worker-token');
  if (!expected || !provided || expected.length < 32 || provided.length !== expected.length) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return mismatch ? Response.json({ error: 'Unauthorized' }, { status: 401 }) : null;
}
