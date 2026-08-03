// Cloudflare Pages Function: POST /api/waitlist
// Stores emails in the KV namespace bound as WAITLIST (Pages → Settings → Bindings).
export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  email = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  if (!env.WAITLIST) {
    // KV binding not configured yet — fail honestly, client shows the error state
    return json(503, { ok: false, error: 'not_configured' });
  }

  // crude rate limit: one write per IP per 10s window
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = `rl:${ip}`;
  if (await env.WAITLIST.get(rlKey)) {
    return json(429, { ok: false, error: 'slow_down' });
  }
  await env.WAITLIST.put(rlKey, '1', { expirationTtl: 60 });

  await env.WAITLIST.put(
    `email:${email}`,
    JSON.stringify({
      email,
      at: new Date().toISOString(),
      country: request.headers.get('CF-IPCountry') || '',
      ua: (request.headers.get('User-Agent') || '').slice(0, 200),
    })
  );

  return json(200, { ok: true });
}
