// Cloudflare Pages Function: GET /go?to=<target>
//
// Universal-link resolver (ADDENDUM §C.2). Most `to` targets still just land
// on the home page until the app ships (unchanged from before). `trip-plan/
// {code}` is the one exception, and the one that actually matters right now
// — LIGHTHOUSE_TRIP_PLANS_DESIGN.md §2.
//
// WHY THIS FILE EXISTS AT ALL: WhatsApp/iMessage/Telegram crawlers read the
// raw <head> of whatever URL is in the message. They don't execute JS and
// don't reliably chase redirects. lighthouse-frontend is pure client-
// rendered React, so even with OG tags baked into its index.html they'd be
// static and identical for every trip — a crawler that can't run JS can
// never see per-trip data injected by React. This function is the fix: it
// fetches the trip's public preview from the API and server-renders real,
// per-trip <head> tags before redirecting a real visitor onward into the
// app. No user-agent sniffing — one code path for everyone; crawlers read
// the <head> and stop, real visitors get an instant meta-refresh + JS
// redirect past this page.
//
// Runs on the Workers/V8 runtime, not Node — no `fs`, no Node crypto. Only
// fetch/URL/template strings, all safe here.

const APP_ORIGIN = "https://letsgolighthouse.co.in";
const DEFAULT_API_BASE = "https://api.letsgolighthouse.co.in";
const TRIP_PLAN_PREFIX = "trip-plan/";
// A shared profile link (`GET /me/profile-link`, `friends.py`) — the second
// `to=` target this resolver handles, added alongside the friend-graph work.
// Same shape as the trip-plan case below: a crawler-facing branded card, then
// a redirect into the SPA.
const PROFILE_PREFIX = "profile/";
const FALLBACK_IMAGE = `${APP_ORIGIN}/api/og-image?title=Lighthouse&subtitle=Stop%20saving%20reels.%20Start%20going.%20Weekend%20discovery%20for%20Bangalore%20and%20beyond.&badge=Join%20the%20waitlist`;

// XSS note (load-bearing, not optional): a trip's `title` is organizer-
// controlled free text, reflected into raw HTML here with no DOM/textContent
// escape hatch available in the Workers runtime. Every interpolated field
// goes through this before it touches the template — do not add a new
// interpolation below without routing it through here too.
function escapeHtml(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

function renderInterstitial({ title, description, image, redirectTo }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeRedirect = escapeHtml(redirectTo);
  // JSON.stringify on a plain string is a safe way to get a JS string
  // literal into a <script> block — it escapes quotes/backslashes itself,
  // and redirectTo never contains "</script>" (it's always our own
  // APP_ORIGIN + a URL-encoded invite code).
  const redirectJs = JSON.stringify(redirectTo);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:image" content="${safeImage}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${safeRedirect}">
<style>body{background:#0F0F12;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style>
</head>
<body>
<p>Taking you to Lighthouse&hellip; <a href="${safeRedirect}" style="color:#5DCAA5">tap here</a> if nothing happens.</p>
<script>window.location.replace(${redirectJs});</script>
</body>
</html>`;
}

function htmlResponse(html) {
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function fetchTripPreview(apiBase, code) {
  try {
    const resp = await fetch(`${apiBase}/trip-plans/${encodeURIComponent(code)}/preview`, {
      headers: { accept: "application/json" },
    });
    if (!resp.ok) return null; // unknown code (404) or a hiccup — never errors, see below
    return await resp.json();
  } catch {
    // API unreachable — fall back to the generic card rather than a 500.
    return null;
  }
}

// The branded card generator (functions/api/og-image.js) — same origin, so
// no CORS concern and no separate env var to keep in sync with APP_ORIGIN.
const OG_IMAGE_PATH = `${APP_ORIGIN}/api/og-image`;

/**
 * Builds the `/api/og-image` URL for a trip-plan card.
 *
 * This is the fix for the thing the marketing doc (§4, the Reel Loop) names
 * as a requirement and the original version of this file didn't do: `og:image`
 * used to point straight at `preview.cover_image` — a bare, uncredited
 * photograph with no wordmark and nothing that survives a screenshot out of
 * context. Every trip-plan share now renders the actual branded card instead.
 *
 * Falls back to `FALLBACK_IMAGE` (the dynamic `/api/og-image` card) only when there is no
 * `preview` at all (an unreachable API or an unknown code) — the og-image
 * endpoint itself already degrades gracefully to a plain brand-gradient card
 * when there's no cover photo, so a *known* trip with no photo still gets the
 * branded treatment rather than silently falling back to the static asset.
 */
function ogImageUrl({ title, subtitle, badge, coverImage }) {
  const params = new URLSearchParams({ title, subtitle, badge });
  if (coverImage) params.set("image", coverImage);
  return `${OG_IMAGE_PATH}?${params.toString()}`;
}

async function fetchProfilePreview(apiBase, code) {
  try {
    // `/profile-links/{code}` is the same endpoint the app itself opens a
    // shared link into (`friends.py::open_profile_link`), and it's already
    // safe to call with no Authorization header: an anonymous `viewer`
    // resolves to `None`, which skips the `ProfileDiscovery` write and
    // returns `relationship: "none"` — a crawler's own fetch here never
    // fakes a "you opened this" signal, and never leaks phone/email since
    // `PublicProfileOut` never carries them.
    const resp = await fetch(`${apiBase}/profile-links/${encodeURIComponent(code)}`, {
      headers: { accept: "application/json" },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function profileCard(profile, redirectTo) {
  if (profile === null) {
    return renderInterstitial({
      title: "Someone shared their Lighthouse profile",
      description: "Tap to see their trips and collections.",
      image: FALLBACK_IMAGE,
      redirectTo,
    });
  }

  const name = profile.display_name || "Someone";
  const title = `Add ${name} on Lighthouse`;
  const description =
    profile.bio && profile.bio.trim()
      ? profile.bio.trim()
      : "Tap to see their trips and public collections on Lighthouse.";
  const badge = profile.places_visited > 0 ? `BEEN TO ${profile.places_visited} PLACES` : "";

  return renderInterstitial({
    title,
    description,
    // No cover photo for a person — an icon avatar isn't a real photograph,
    // so `ogImageUrl` gets no `coverImage` and the card renders its plain
    // brand-gradient background, same graceful path a photo-less trip-plan
    // card already takes.
    image: ogImageUrl({ title, subtitle: description, badge, coverImage: null }),
    redirectTo,
  });
}

function tripPlanCard(preview, redirectTo) {
  // Unknown or finalized code: never errors (§2). An unknown/unreachable
  // code falls back to a generic invite card; a finalized plan gets a
  // "they picked X" framing instead of a stale "vote now" pitch.
  if (preview === null) {
    return renderInterstitial({
      title: "You're invited to a Lighthouse trip plan",
      description: "Tap to see the shortlist and vote.",
      image: FALLBACK_IMAGE,
      redirectTo,
    });
  }

  const isFinalized = preview.status === "finalized";
  const candidateCount = preview.candidate_count ?? (preview.candidates ? preview.candidates.length : 0);

  const title =
    isFinalized && preview.winner_name
      ? `They picked ${preview.winner_name}!`
      : preview.title || "You're invited to a Lighthouse trip plan";

  let description;
  if (isFinalized) {
    description = "The group voted — see the winner on Lighthouse.";
  } else {
    const who = preview.organizer_first_name ? `${preview.organizer_first_name} shortlisted` : "Someone shortlisted";
    const places = `${candidateCount} place${candidateCount === 1 ? "" : "s"}`;
    description = `${who} ${places} for a weekend trip. Vote before they decide.`;
  }

  const badge = isFinalized ? "DECIDED" : `${candidateCount} VOTING`;

  return renderInterstitial({
    title,
    description,
    image: ogImageUrl({ title, subtitle: description, badge, coverImage: preview.cover_image }),
    redirectTo,
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") || "";

  // LIGHTHOUSE_API_BASE lets the Pages project point at the tunnel hostname
  // (§5.1: api.letsgolighthouse.co.in) via an environment variable rather
  // than a hardcoded value baked into this file; falls back to the
  // production hostname the design doc settles on.
  const apiBase = (env && env.LIGHTHOUSE_API_BASE) || DEFAULT_API_BASE;

  if (to.startsWith(PROFILE_PREFIX)) {
    const code = to.slice(PROFILE_PREFIX.length);
    const redirectTo = `${APP_ORIGIN}/appv1/profile/${encodeURIComponent(code)}`;
    if (!code) return htmlResponse(profileCard(null, redirectTo));
    const preview = await fetchProfilePreview(apiBase, code);
    return htmlResponse(profileCard(preview, redirectTo));
  }

  if (!to.startsWith(TRIP_PLAN_PREFIX)) {
    // Every other `to` target still just lands on the home page for now —
    // unchanged from before this file anticipated trip-plan invites.
    const dest = new URL("/", url.origin);
    if (to) dest.searchParams.set("from", "go");
    return Response.redirect(dest.toString(), 302);
  }

  const code = to.slice(TRIP_PLAN_PREFIX.length);
  const redirectTo = `${APP_ORIGIN}/appv1/trip/${encodeURIComponent(code)}`;

  if (!code) {
    return htmlResponse(tripPlanCard(null, redirectTo));
  }

  const preview = await fetchTripPreview(apiBase, code);

  return htmlResponse(tripPlanCard(preview, redirectTo));
}
