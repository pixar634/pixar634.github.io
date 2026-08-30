// Called by the waitlist_send_confirmation trigger (landing/scripts/waitlist-supabase.sql)
// the instant a new row lands in public.waitlist. Not reachable by the browser —
// gated by a plain shared-secret header (TRIGGER_SECRET), checked by hand below
// rather than via withSupabase's auth: 'secret:<name>' mode. That mode checks
// against a Supabase-managed secret API key, and Supabase never returns a secret
// key's plaintext after creation — not even to the project owner via the
// dashboard's own history — so there was no way to also put the matching value
// into this trigger's header. A self-generated value set as an Edge Function
// secret sidesteps that: this process controls both ends.

import { withSupabase } from 'npm:@supabase/server@^1';
import { buildConfirmEmail } from '../_shared/emails.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const TRIGGER_SECRET = Deno.env.get('TRIGGER_SECRET')!;
const FROM = 'The Lighthouse <hello@letsgolighthouse.co.in>';

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.headers.get('x-lh-secret') !== TRIGGER_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }

    const payload = await req.json();
    const row = payload.record ?? payload;
    const email = row.email as string | undefined;
    const code = row.code as string | undefined;
    const verifyToken = row.verify_token as string | undefined;

    if (!email || !code || !verifyToken) {
      return Response.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    const verifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-waitlist?token=${verifyToken}`;
    const { subject, html } = buildConfirmEmail({ code, verifyUrl });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: email, subject, html }),
    });

    if (!res.ok) {
      return Response.json({ ok: false, error: await res.text() }, { status: 502 });
    }

    // Stamped so resend-webhook can later match a bounce event back to this
    // row by Resend's own email id. Best-effort — a failed update here must
    // never turn an already-sent email into an error response.
    try {
      const sent = await res.json();
      if (sent?.id) {
        await ctx.supabaseAdmin
          .from('waitlist')
          .update({ resend_email_id: sent.id })
          .eq('verify_token', verifyToken);
      }
    } catch {
      // ignored — see comment above
    }

    return Response.json({ ok: true });
  }),
};
