// Hit by the "confirm your spot" link in the confirmation email — a plain
// browser GET with no credential, so auth: 'none' (ctx.supabaseAdmin still
// carries the service role, which is what confirm_waitlist_email() requires).
// Always ends in a redirect to /verified.html; that page is the confirmation
// landing page the user actually sees.

import { withSupabase } from 'npm:@supabase/server@^1';
import { buildMilestoneEmail, buildFounderEmail } from '../_shared/emails.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = 'The Lighthouse <hello@letsgolighthouse.co.in>';
const FOUNDER_FROM = 'Soumava at Lighthouse <hello@letsgolighthouse.co.in>';
const SITE = 'https://letsgolighthouse.co.in';

const sendEmail = (to: string, from: string, subject: string, html: string) =>
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  }).catch(() => {});

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      return Response.redirect(`${SITE}/verified.html?state=invalid`, 302);
    }

    const { data, error } = await ctx.supabaseAdmin.rpc('confirm_waitlist_email', {
      p_token: token,
    });

    if (error || !data || data.ok === false) {
      return Response.redirect(`${SITE}/verified.html?state=invalid`, 302);
    }

    // Both best-effort — neither failing may turn a successful verification
    // into an error page.
    if (data.milestone && data.referrer_email) {
      const { subject, html } = buildMilestoneEmail();
      await sendEmail(data.referrer_email, FROM, subject, html);
    }

    // Only present on a genuine first verification (see the SQL comment on
    // confirm_waitlist_email) — this is what makes it fire exactly once per
    // person, ever, not on every "already confirmed" repeat click.
    if (!data.already && data.email) {
      const { subject, html } = buildFounderEmail();
      await sendEmail(data.email, FOUNDER_FROM, subject, html);
    }

    const params = new URLSearchParams({
      state: data.already ? 'already' : 'ok',
      role: data.role ?? '',
      code: data.code ?? '',
      referrals: String(data.referrals ?? 0),
    });
    return Response.redirect(`${SITE}/verified.html?${params.toString()}`, 302);
  }),
};
