// Cloudflare Pages Function: GET /api/export?key=<ADMIN_KEY>
// Private CSV export of the waitlist. Set ADMIN_KEY as an environment variable
// in Pages → Settings → Environment variables (pick a long random string).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!env.ADMIN_KEY || !key || key !== env.ADMIN_KEY) {
    return new Response('Not found', { status: 404 });
  }
  if (!env.WAITLIST) {
    return new Response('KV not configured', { status: 503 });
  }

  const rows = ['email,joined_at,country'];
  let cursor;
  do {
    const page = await env.WAITLIST.list({ prefix: 'email:', cursor });
    for (const k of page.keys) {
      const raw = await env.WAITLIST.get(k.name);
      if (!raw) continue;
      try {
        const d = JSON.parse(raw);
        rows.push(`${d.email},${d.at},${d.country}`);
      } catch {}
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lighthouse-waitlist.csv"',
    },
  });
}
