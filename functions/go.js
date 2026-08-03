// Cloudflare Pages Function: GET /go?to=<target>
// Universal-link resolver (ADDENDUM §C.2). Until the app ships, everything
// lands on the home page; post-launch this resolves to store links / deep links
// with OG tags per target (trip-plan invites, place cards).
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to') || '';

  // Future: switch on `to` (e.g. trip-plan/{id}) → render an OG-rich interstitial
  // that deep-links into the app (lighthouse://) with store fallback.
  const dest = new URL('/', url.origin);
  if (to) dest.searchParams.set('from', 'go');

  return Response.redirect(dest.toString(), 302);
}
