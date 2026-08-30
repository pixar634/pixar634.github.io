// The waitlist confirmation + milestone emails.
//
// v2 — the "Group Chat" concept kept its lowercase, casual voice (that part
// tested well) but dropped two things that didn't survive contact with the
// real product: the organizer/rider copy split (the role picker is commented
// out on the live form — every signup is role=null, so "you get to just show
// up" was fiction nobody actually saw the alternative to) and the plain-text
// iMessage-bubble look, which read as generic rather than as Lighthouse. This
// version keeps the voice, drops the role branch, and borrows the site's own
// sonar/beacon motif (the hero map's pulse-and-scan loader) as the one piece
// of visual brand identity instead of inventing a new one.
//
// Table-based and inline-styled throughout — this is email, not web, and old
// Outlook only reliably renders tables. The one CSS-animation block lives in
// <style> in <head>; clients that support @keyframes (Apple/iOS Mail, most
// modern webmail) get a breathing beacon and a bouncing "typing" indicator,
// clients that don't (desktop Outlook) fall back to the static end-state —
// a solid dot, a flat button — never to something broken or misaligned.
// Brand colors from CLAUDE.md (base #0F0F12, surface #1A1A1F, Trail Mint
// #5DCAA5, Sunrise Amber #E0A458 — no other accent hues). The font stack
// falls back past Space Grotesk to system sans because most inboxes strip
// @font-face; that fallback is an email-rendering constraint, not a brand one.

const BASE = '#0F0F12';
const SURFACE = '#1A1A1F';
const CARD = '#1F2024';
const HAIRLINE = '#2C2C33';
const MINT = '#5DCAA5';
const MINT_SOFT = 'rgba(93,202,165,0.16)';
const AMBER = '#E0A458';
const TEXT_1 = '#F2F1EC';
const TEXT_2 = '#B7B7C0';
const TEXT_3 = '#7C7D87';
const FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function shell(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<title></title>
<style>
  @keyframes lhBeacon {
    0%   { box-shadow: 0 0 0 0 rgba(93,202,165,0.40), 0 0 0 0 rgba(93,202,165,0.20); }
    70%  { box-shadow: 0 0 0 10px rgba(93,202,165,0.08), 0 0 0 22px rgba(93,202,165,0.03); }
    100% { box-shadow: 0 0 0 14px rgba(93,202,165,0), 0 0 0 30px rgba(93,202,165,0); }
  }
  @keyframes lhBlink {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
  }
  .lh-beacon { animation: lhBeacon 2.6s ease-out infinite; }
  .lh-dot-a { animation: lhBlink 1.2s ease-in-out infinite; }
  .lh-dot-b { animation: lhBlink 1.2s ease-in-out 0.2s infinite; }
  .lh-dot-c { animation: lhBlink 1.2s ease-in-out 0.4s infinite; }
</style>
</head>
<body style="margin:0; padding:0; background:${BASE};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BASE};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:480px;">
          <tr><td style="height:4px; line-height:4px; font-size:0; background:${MINT}; background-image:linear-gradient(90deg, ${MINT}, ${AMBER}); border-radius:14px 14px 0 0;">&nbsp;</td></tr>
          <tr>
            <td style="background:${SURFACE}; border-left:1px solid ${HAIRLINE}; border-right:1px solid ${HAIRLINE}; padding: 34px 32px 30px;">

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <div class="lh-beacon" style="width:12px; height:12px; border-radius:50%; background:${MINT}; box-shadow: 0 0 0 8px ${MINT_SOFT}, 0 0 0 16px rgba(93,202,165,0.06);">&nbsp;</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${FONT}; font-weight:700; font-size:13px; letter-spacing:0.14em; color:${TEXT_1};">
                    LIGHTHOUSE<span style="color:${AMBER};">.</span>
                  </td>
                </tr>
              </table>

              ${bodyHtml}
            </td>
          </tr>
          <tr><td style="height:4px; line-height:4px; font-size:0; background:${HAIRLINE}; border-radius:0 0 14px 14px;">&nbsp;</td></tr>
        </table>
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:480px;">
          <tr>
            <td style="padding: 20px 12px 0; font-family:${FONT}; font-size:12px; line-height:1.6; color:${TEXT_3}; text-align:center;">
              you're getting this because you joined the waitlist at letsgolighthouse.co.in.<br />
              wrong inbox, or want off the list? just reply — a person reads these.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Log-style message cards, not chat bubbles — a mint edge marks the voice
// speaking, amber marks the one thing you're meant to keep (your code). Both
// read as a transmission from the app itself rather than a mocked-up group
// chat with an invisible other person in it.
function line(text: string, opts: { accent?: 'mint' | 'amber'; mono?: boolean; muted?: boolean } = {}): string {
  const accentColor = opts.accent === 'amber' ? AMBER : opts.accent === 'mint' ? MINT : 'transparent';
  const font = opts.mono ? MONO : FONT;
  const color = opts.muted ? TEXT_3 : opts.mono ? MINT : TEXT_1;
  const size = opts.muted ? '13px' : '15px';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 10px; width:100%;"><tr>
    <td style="width:3px; background:${accentColor}; border-radius:3px 0 0 3px;">&nbsp;</td>
    <td style="background:${CARD}; border:1px solid ${HAIRLINE}; border-left:0; border-radius:0 8px 8px 0; padding:13px 16px; font-family:${font}; font-size:${size}; line-height:1.55; color:${color};">${text}</td>
  </tr></table>`;
}

function typing(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 12px 3px;"><tr>
    <td style="font-family:${MONO}; font-size:11px; color:${TEXT_3}; padding-right:6px;">the lighthouse is signalling</td>
    <td class="lh-dot-a" style="font-size:11px; color:${MINT};">&bull;</td>
    <td class="lh-dot-b" style="font-size:11px; color:${MINT};">&bull;</td>
    <td class="lh-dot-c" style="font-size:11px; color:${MINT};">&bull;</td>
  </tr></table>`;
}

// Bulletproof button: a solid table cell for every client, plus an mso VML
// fallback so old desktop Outlook (which ignores border-radius/padding on
// <a>) still renders a real, clickable, correctly-colored button.
function ctaButton(href: string, label: string): string {
  return `
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%" fillcolor="${MINT}" stroke="f">
<w:anchorlock/>
<center style="color:${BASE};font-family:sans-serif;font-size:15px;font-weight:700;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 10px 0 6px;"><tr><td style="border-radius:999px; background:${MINT}; box-shadow: 0 0 0 1px rgba(93,202,165,0.35), 0 10px 24px rgba(93,202,165,0.22);">
<a href="${href}" style="display:inline-block; padding:14px 30px; font-family:${FONT}; font-weight:700; font-size:15px; color:${BASE}; text-decoration:none; border-radius:999px;">${label}</a>
</td></tr></table>
<!--<![endif]-->`;
}

function signoff(): string {
  return `<div style="font-family:${FONT}; font-size:14px; color:${TEXT_3}; margin-top: 20px;">&mdash; the lighthouse, texting like a person</div>`;
}

export function buildConfirmEmail(opts: { code: string; verifyUrl: string }) {
  const subject = "confirm you're in — tap once, you're official";

  const body = `
    ${line('yo. you&rsquo;re almost in.')}
    ${typing()}
    ${line('we open bangalore in waves, not all at once &mdash; invite 3 friends with your link and you skip straight to wave one')}
    ${line('one thing first &mdash; tap below so we know this inbox is really yours')}
    ${ctaButton(opts.verifyUrl, 'confirm your spot')}
    ${line(`${opts.code} &mdash; that&rsquo;s your invite code once you&rsquo;re confirmed. don&rsquo;t lose it`, { accent: 'amber', mono: true })}
    ${line('also &mdash; 500 places already mapped, 25 categories deep. waterfalls, night drives, temple runs, all of it')}
    ${signoff()}
  `;

  return { subject, html: shell("you're almost on the list — one tap to lock it in", body) };
}

export function buildMilestoneEmail() {
  const subject = "you did it. wave one's yours.";
  const body = `
    ${line('yo. you actually got 3 people in.')}
    ${typing()}
    ${line('wave one&rsquo;s locked in for you. no more waiting on this one')}
    ${line('see you there')}
    ${signoff()}
  `;
  return { subject, html: shell("wave one's locked in for you", body) };
}

// The founder email — deliberately NOT the shell() template above. The whole
// point (see the Resend welcome email this was modeled on) is that it reads
// as a real person's inbox message, not a company's, so it gets none of the
// beacon mark, the accent bar, the dark card — just default black-on-white
// text a mail client renders exactly like any other email a friend sent.
// Fires once, on first verification (see verify-waitlist), never again —
// the copy below promises "nothing else until wave one," so the code has to
// actually keep that promise rather than becoming the start of a drip.
export function buildFounderEmail() {
  const subject = 'quick note from Lighthouse';
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0; padding:0; background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="580" cellpadding="0" cellspacing="0" style="width:580px; max-width:580px;"><tr><td style="padding:32px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:15px; line-height:1.6; color:#1a1a1a;">
<p>Hey,</p>
<p>I'm Soumava &mdash; I built Lighthouse.</p>
<p>It started with a scroll, ngl. Another reel of a waterfall two hours outside a city I'd never actually left that weekend. I kept saving places like that and never going, so I built the thing I actually wanted: a map that already knows how to get there, and a way to get a group to actually agree on something for once.</p>
<p>Building it kind of unlocked something for me, honestly &mdash; deciding fast, going anyway, not letting a random Tuesday scroll turn into another someday that never happens. That's the actual thing I want you to have too. The app is just how you get it.</p>
<p style="margin:24px 0; padding-left:16px; border-left:2px solid #e5e5e5; font-style:italic; color:#444;">"Roads were made for journeys, not destinations."<br />&mdash; Confucius, well before group chats existed to ruin the plan</p>
<p>You're on the list for wave one in Bangalore. I'll email you the moment it opens &mdash; nothing else until then, no filler updates in between.</p>
<p><strong>P.S.</strong> &mdash; why'd you join? A specific place you've been meaning to go, or just tired of the "so&hellip; where are we actually going?" text that never gets answered? Hit reply and tell me. I read every one.</p>
<p>&mdash; Soumava</p>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
  return { subject, html };
}
