// Cloudflare Pages Function: POST /api/contact
// Stores messages in the same KV namespace bound as WAITLIST (Pages → Settings →
// Bindings) under a "contact:" prefix — reuses the one namespace already set up
// rather than requiring a second binding for a low-volume form.
export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let name, email, message;
  try {
    ({ name, email, message } = await request.json());
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  name = (name || '').trim().slice(0, 150);
  email = (email || '').trim().toLowerCase();
  message = (message || '').trim().slice(0, 4000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return json(400, { ok: false, error: 'invalid_input' });
  }

  if (!env.WAITLIST) {
    return json(503, { ok: false, error: 'not_configured' });
  }

  // separate rate-limit key from the waitlist form so the two don't contend
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = `rlcontact:${ip}`;
  if (await env.WAITLIST.get(rlKey)) {
    return json(429, { ok: false, error: 'slow_down' });
  }
  await env.WAITLIST.put(rlKey, '1', { expirationTtl: 60 });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await env.WAITLIST.put(
    `contact:${id}`,
    JSON.stringify({
      name,
      email,
      message,
      at: new Date().toISOString(),
      country: request.headers.get('CF-IPCountry') || '',
      ua: (request.headers.get('User-Agent') || '').slice(0, 200),
    })
  );

  return json(200, { ok: true });
}
