// Resend calls this when an email it sent bounces or gets marked as spam.
// This is the only way to know a syntactically-valid address was fake or
// unreachable — Resend's send API only confirms it handed the email to the
// receiving mail server, not that the mailbox actually exists; the real
// answer comes back seconds-to-minutes later, here, async. See the "BOUNCE
// DETECTION" note in landing/scripts/waitlist-supabase.sql for the full
// design (why this can't block the signup response, and how the browser
// picks the result up on a later visit via check_waitlist_status()).
//
// Verified via Svix (the signing scheme Resend's webhooks use), not the
// TRIGGER_SECRET pattern the other two functions use — Resend is the one
// caller here this process doesn't control both ends of, so it has to trust
// Resend's own signature instead of a shared secret it minted itself.

import { withSupabase } from 'npm:@supabase/server@^1';
import { Webhook } from 'npm:svix@^1';

const WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET')!;

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const body = await req.text();
    const headers = {
      'svix-id': req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    };

    let event: any;
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      event = wh.verify(body, headers);
    } catch {
      return new Response('invalid signature', { status: 400 });
    }

    if (event?.type === 'email.bounced' || event?.type === 'email.complained') {
      const emailId = event?.data?.email_id as string | undefined;
      if (emailId) {
        await ctx.supabaseAdmin.rpc('mark_waitlist_bounced', { p_email_id: emailId });
      }
    }

    // Every other event type (delivered, opened, clicked, …) is acknowledged
    // and ignored — this endpoint only cares about proving an address dead.
    return Response.json({ ok: true });
  }),
};
