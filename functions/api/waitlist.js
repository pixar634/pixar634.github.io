// Cloudflare Pages Function: POST /api/waitlist
// Stores emails in the KV namespace bound as WAITLIST (Pages → Settings → Bindings).
//
// This endpoint is the pre-launch rehearsal of the vote loop (MARKETING §6, Stage 0).
// It does three things beyond storing an address, each tied to a number the business
// has to prove before it spends the launch budget:
//
//   1. Issues a referral code and counts who joins through it. K-factor (BUSINESS §7,
//      metric 1) is the gate on the whole growth thesis, and today the only plan to
//      read it is "launch, then measure." A waitlist referral gives a directional read
//      on invite propensity weeks earlier, on the same WhatsApp substrate the real
//      loop runs on, for zero spend.
//   2. Records whether someone plans trips or comes along. One organizer is worth
//      3-8 installs and is the only credible Pro buyer (MARKETING §3), so the list
//      is only useful as a launch *sequence* if we know which is which.
//   3. Stays idempotent per email. Re-submitting returns the same code and the same
//      referral count — a returning user must never be told a different story.
//
// Deliberately NOT here: an absolute queue position. KV has no atomic increment, so
// any rank would be approximate, and a precise-looking number we cannot actually
// compute is the kind of thing this project refuses everywhere else. Progress toward
// the 3-friend threshold is real, and it is what the marketing doc actually specifies.

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — these get read aloud
const REFERRAL_GOAL = 3;

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let email;
  let role;
  let ref;
  try {
    ({ email, role, ref } = await request.json());
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  email = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  // Only two roles are meaningful to the launch sequence; anything else is dropped
  // rather than stored, so a hand-crafted POST can't write junk into the segment.
  role = role === 'organizer' || role === 'rider' ? role : null;
  ref = typeof ref === 'string' ? ref.trim().toUpperCase().slice(0, 12) : '';
  if (!/^[A-Z0-9]{4,12}$/.test(ref)) ref = '';

  if (!env.WAITLIST) {
    // KV binding not configured yet — fail honestly, client shows the error state
    return json(503, { ok: false, error: 'not_configured' });
  }

  const existingRaw = await env.WAITLIST.get(`email:${email}`);

  // Rate limit only *new* signups. A returning visitor re-checking their own progress
  // must not be told to slow down — that reads as the site being broken.
  if (!existingRaw) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rlKey = `rl:${ip}`;
    if (await env.WAITLIST.get(rlKey)) {
      return json(429, { ok: false, error: 'slow_down' });
    }
    await env.WAITLIST.put(rlKey, '1', { expirationTtl: 60 });
  }

  let record;

  if (existingRaw) {
    // Idempotent path: keep the original code, join date and referrer. Only fill in
    // a role if they didn't pick one the first time.
    try {
      record = JSON.parse(existingRaw);
    } catch {
      record = null;
    }
    if (!record || !record.code) {
      record = { email, code: newCode(), at: new Date().toISOString() };
    }
    if (role && !record.role) record.role = role;
  } else {
    record = {
      email,
      code: newCode(),
      role: role || null,
      referred_by: ref || null,
      at: new Date().toISOString(),
      country: request.headers.get('CF-IPCountry') || '',
      ua: (request.headers.get('User-Agent') || '').slice(0, 200),
    };

    // Credit the referrer. Guarded so a self-referral or an unknown code is a no-op
    // rather than an error the visitor ever sees — attribution failing must never
    // block someone from joining.
    if (ref) {
      const refEmail = await env.WAITLIST.get(`code:${ref}`);
      if (refEmail && refEmail !== email) {
        const refRaw = await env.WAITLIST.get(`email:${refEmail}`);
        if (refRaw) {
          try {
            const refRecord = JSON.parse(refRaw);
            refRecord.referrals = (refRecord.referrals || 0) + 1;
            await env.WAITLIST.put(`email:${refEmail}`, JSON.stringify(refRecord));
          } catch {
            /* a corrupt referrer row must not fail this signup */
          }
        }
      } else {
        record.referred_by = null; // don't store a code that credited nobody
      }
    }
  }

  await env.WAITLIST.put(`email:${email}`, JSON.stringify(record));
  await env.WAITLIST.put(`code:${record.code}`, email);

  return json(200, {
    ok: true,
    code: record.code,
    referrals: record.referrals || 0,
    goal: REFERRAL_GOAL,
    returning: Boolean(existingRaw),
  });
}
