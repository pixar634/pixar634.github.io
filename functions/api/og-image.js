// Cloudflare Pages Function: GET /api/og-image
//
// The branded card behind every WhatsApp/iMessage unfurl and every
// Instagram-exportable share asset — one renderer, three destinations:
//
//   1. go.js's trip-plan interstitial points its `og:image` here, so a
//      shared invite link renders this card in the recipient's chat instead
//      of a raw, uncredited photograph.
//   2. `?ratio=square` (1080x1080) is the same design in Instagram's own
//      aspect ratio, for the "save/share this card" action in
//      InviteShareSheet.tsx.
//   3. Reusable by anything else that wants a branded card later (a single
//      place's share, the Answer Account's daily post) — the params are
//      generic (title/subtitle/image/badge), not trip-plan-specific.
//
// WHY THIS FILE EXISTS AT ALL, and why it needs the one dependency in
// package.json: `go.js` used to point `og:image` straight at
// `preview.cover_image` — a bare, uncredited photograph with no wordmark, no
// accent, nothing that survives being screenshotted out of context. The
// marketing doc (LIGHTHOUSE_MARKETING_STRATEGY.md §4, the Reel Loop) already
// names the requirement this file fills: "product must make the outbound
// place card gorgeous and watermarked." This is that card, generated at
// request time so it can carry the real title/photo/vote-count per link
// rather than being one static asset.
//
// Runs on the Workers/V8 runtime via `workers-og` (Satori + resvg compiled to
// WASM) — no headless browser, no server to keep warm. `workers-og` accepts
// a plain HTML string (no JSX/build step needed), which is what keeps this
// file consistent with the rest of `landing/` being dependency-free,
// zero-build static files: one npm package, no bundler config, no
// wrangler.toml — Cloudflare's Pages build resolves package.json
// automatically before bundling `functions/`.

import { ImageResponse } from "workers-og";

const BASE_BG = "#0F0F12";
const MINT = "#5DCAA5";
const AMBER = "#E0A458";
const APP_ORIGIN = "https://letsgolighthouse.co.in";

const SIZES = {
  og: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
};

// Fonts actually in the brand (root CLAUDE.md: "never Inter, Roboto, Arial,
// Helvetica, or Segoe UI"). Both ship on Google Fonts, which is what makes
// fetching them at request time viable without bundling font files into a
// project that otherwise has zero build tooling.
const FONTS = {
  display: { family: "Syne", weight: 700 },
  body: { family: "Space Grotesk", weight: 500 },
};

/**
 * Fetches one Google Font's TTF bytes for exactly the characters this card
 * needs. `&text=` subsets the font to those glyphs, which is what keeps this
 * a fast, small fetch on every request rather than pulling a full font file.
 *
 * The `User-Agent` matters: Google's font CSS endpoint serves woff2 to a
 * modern browser UA and TTF/OTF to an older one, and Satori (the engine
 * behind `workers-og`) wants TTF/OTF, not woff2. This is the standard trick
 * every Satori-based OG-image project uses for exactly this reason.
 *
 * Soft-fails to `null` rather than throwing — a font Google's CDN hiccuped
 * on for one request must not take the whole card down. The caller falls
 * back to Satori's built-in default sans, which is plainer but never
 * missing entirely (Design System §4.2's "failures are calm" applied to
 * infrastructure, not just UI).
 */
async function loadGoogleFont(family, weight, text) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const cssResp = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
      },
    });
    if (!cssResp.ok) return null;
    const css = await cssResp.text();
    // The old-Chrome User-Agent above is meant to steer Google onto ttf/otf,
    // but it isn't guaranteed — this endpoint was observed serving woff
    // regardless in testing. Accept whatever format Google actually sent
    // rather than assuming one: recent Satori (the engine `workers-og` wraps)
    // parses woff/woff2 directly, so narrowing the regex to ttf/otf only
    // meant every real request here silently fell back to no custom font at
    // all — verified live, not theoretical.
    const match = css.match(/src: url\(([^)]+)\) format\('(\w+)'\)/);
    if (!match) return null;
    const fontResp = await fetch(match[1]);
    if (!fontResp.ok) return null;
    return await fontResp.arrayBuffer();
  } catch (err) {
    console.error("loadGoogleFont failed", family, String(err));
    return null;
  }
}

/**
 * The background photo, as a data URI. `workers-og`/Satori renders from a
 * static document tree, not a live browser — it cannot be trusted to fetch
 * a remote `<img src>` itself mid-render the way a real browser would, so
 * the image is fetched and inlined here instead, exactly like the font
 * above.
 *
 * Soft-fails to `null` — a photo host being slow or a bad URL must degrade
 * to the plain-gradient background below, never break the whole card.
 */
async function loadImageAsDataUri(url) {
  if (!url) return null;
  try {
    const resp = await fetch(url, {
      headers: {
        // Wikimedia Commons's User-Agent policy (meta.wikimedia.org/wiki/
        // User-Agent_policy) rejects generic/absent User-Agents with a 403 —
        // verified live against this exact endpoint, not a defensive guess.
        // Most of this catalog's photos are Commons URLs, so this is the
        // common case, not an edge case: without an identifying UA, the
        // background photo silently failed on effectively every card.
        "User-Agent": "Lighthouse/1.0 (https://letsgolighthouse.co.in; weekend-discovery app) og-image-fetch",
      },
    });
    if (!resp.ok) return null;
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    // Chunked to stay well under the engine's argument-size limits on a
    // single `String.fromCharCode(...spread)` call for a multi-hundred-KB
    // photo — the harvest pipeline's own images run 200-800KB.
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch (err) {
    console.error("loadImageAsDataUri failed", url, String(err));
    return null;
  }
}

/**
 * Structural-only escaping — deliberately narrower than `go.js`'s own
 * `escapeHtml` (which this was first copy-pasted from), and the difference
 * is load-bearing, not a style choice.
 *
 * `workers-og`'s HTML parser (`satori-html`) does **not** decode entities
 * back out when it reads text content — verified live, not assumed: escaping
 * `&` to `&amp;` here made a real trip title ("...Peak & Seethalayyanagiri")
 * render as the literal five characters `&`, `a`, `m`, `p`, `;`, and since
 * the font is subset per-request from the *raw* (unescaped) title text, `m`
 * and `;` had no glyph in that subset at all — two empty boxes where the
 * ampersand should have been.
 *
 * `go.js` renders into a **real browser** via a `<script>`-bearing HTML
 * page, where an unescaped `<` genuinely is an XSS vector and `&` must be
 * escaped for spec-correct HTML either way. This function renders into
 * Satori's parser only, which never executes anything — the actual risk is
 * layout breakage from a stray tag, not script execution. So: `<`/`>` stay
 * escaped, because letting user text open a real tag inside the document
 * Satori parses would break the card's structure. `&`/`"`/`'` stay literal,
 * because escaping them is exactly the bug above, and none of this file's
 * interpolations land inside an HTML attribute, where quotes would matter.
 */
function escapeHtml(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return str.replace(/[<>]/g, (ch) => (ch === "<" ? "&lt;" : "&gt;"));
}

/**
 * The card itself.
 *
 * One flex column, bottom-aligned content over a full-bleed photo with a
 * darkening scrim — the same "gradient, not a hard band" treatment
 * `PlaceDetail.tsx`'s sticky footer already established for exactly the
 * same reason: text has to read regardless of what the photo underneath is
 * doing.
 *
 * Every element carries its own inline `style` rather than a `<style>`
 * block or CSS classes — `workers-og`'s HTML parser (`satori-html`) is
 * documented and tested against inline styles; a `<style>` tag is a less
 * certain code path for a card that has to render correctly on the very
 * first WhatsApp share, with no visual QA loop once it's live.
 */
function cardHtml({ width, height, title, subtitle, badge, imageDataUri }) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeBadge = escapeHtml(badge);

  const background = imageDataUri
    ? `<img src="${imageDataUri}" width="${width}" height="${height}" style="position:absolute;inset:0;width:${width}px;height:${height}px;object-fit:cover;" />`
    : // No photo — the plain brand gradient, never a blank card. Same base
      // colour the app itself ships on, so a photo-less card still looks
      // like Lighthouse rather than like a placeholder.
      `<div style="position:absolute;inset:0;width:${width}px;height:${height}px;display:flex;background:linear-gradient(160deg, #14181a 0%, ${BASE_BG} 65%);"></div>`;

  // Darker at the bottom (where the text sits) than the top, and present
  // even over the plain-gradient fallback — the scrim is a genuine legibility
  // device, not merely a photo treatment.
  const scrim = `<div style="position:absolute;inset:0;width:${width}px;height:${height}px;display:flex;background:linear-gradient(to top, rgba(6,7,8,0.94) 0%, rgba(6,7,8,0.72) 30%, rgba(6,7,8,0.15) 62%, rgba(6,7,8,0.35) 100%);"></div>`;

  // The beacon — two concentric rings, the sonar/beacon motif the rest of
  // the product uses for "something here matters" (selection glow, the
  // splash beacon dive). A quiet corner accent, not a logo mark.
  const beaconSize = Math.round(height * 0.34);
  const beacon = `
    <div style="position:absolute;top:${-beaconSize * 0.3}px;right:${-beaconSize * 0.3}px;width:${beaconSize}px;height:${beaconSize}px;display:flex;border-radius:9999px;border:2px solid rgba(93,202,165,0.22);"></div>
    <div style="position:absolute;top:${-beaconSize * 0.3 + beaconSize * 0.14}px;right:${-beaconSize * 0.3 + beaconSize * 0.14}px;width:${beaconSize * 0.72}px;height:${beaconSize * 0.72}px;display:flex;border-radius:9999px;border:2px solid rgba(93,202,165,0.34);"></div>
  `;

  const wordmarkSize = Math.round(width * 0.021);
  const titleSize = Math.round(width * (title.length > 26 ? 0.052 : 0.066));
  const subtitleSize = Math.round(width * 0.026);
  const badgeSize = Math.round(width * 0.02);
  const pad = Math.round(width * 0.055);

  return `
    <div style="width:${width}px;height:${height}px;display:flex;position:relative;background:${BASE_BG};font-family:'Space Grotesk';">
      ${background}
      ${scrim}
      ${beacon}

      <div style="position:absolute;top:${pad}px;left:${pad}px;display:flex;align-items:center;">
        <div style="width:${wordmarkSize * 0.6}px;height:${wordmarkSize * 0.6}px;display:flex;border-radius:9999px;background:${MINT};box-shadow:0 0 ${wordmarkSize}px ${MINT};margin-right:${wordmarkSize * 0.7}px;"></div>
        <span style="font-size:${wordmarkSize}px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.86);font-weight:500;">LIGHTHOUSE</span>
      </div>

      <div style="position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:${pad}px;">
        ${
          badge
            ? `<div style="display:flex;align-self:flex-start;align-items:center;padding:${badgeSize * 0.4}px ${badgeSize * 0.9}px;border-radius:9999px;border:1.5px solid rgba(224,164,88,0.55);background:rgba(224,164,88,0.14);margin-bottom:${titleSize * 0.32}px;">
                <span style="font-size:${badgeSize}px;letter-spacing:0.16em;text-transform:uppercase;color:${AMBER};font-weight:500;">${safeBadge}</span>
              </div>`
            : ""
        }
        <div style="display:flex;font-family:'Syne';font-size:${titleSize}px;font-weight:700;line-height:1.08;letter-spacing:-0.01em;color:#F2F4F2;max-width:${width - pad * 2}px;">
          ${safeTitle}
        </div>
        ${
          subtitle
            ? `<div style="display:flex;margin-top:${titleSize * 0.28}px;font-size:${subtitleSize}px;line-height:1.4;color:rgba(242,244,242,0.72);max-width:${Math.round(width * 0.82)}px;">${safeSubtitle}</div>`
            : ""
        }
        <div style="display:flex;margin-top:${titleSize * 0.5}px;font-size:${Math.round(width * 0.016)}px;letter-spacing:0.1em;color:rgba(93,202,165,0.8);">letsgolighthouse.co.in</div>
      </div>
    </div>
  `;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || "Lighthouse").slice(0, 120);
  const subtitle = (url.searchParams.get("subtitle") || "").slice(0, 160);
  const badge = (url.searchParams.get("badge") || "").slice(0, 40);
  const imageParam = url.searchParams.get("image");
  const ratio = url.searchParams.get("ratio") === "square" ? "square" : "og";
  const { width, height } = SIZES[ratio];

  // Every distinct character across every text field — the font subset
  // has to cover all of it, or a glyph outside the subset silently drops.
  const allText = `${title}${subtitle}${badge}LIGHTHOUSEletsgolighthouse.co.in`;

  const [displayFont, bodyFont, imageDataUri] = await Promise.all([
    loadGoogleFont(FONTS.display.family, FONTS.display.weight, allText),
    loadGoogleFont(FONTS.body.family, FONTS.body.weight, allText),
    loadImageAsDataUri(imageParam),
  ]);

  const fonts = [];
  if (displayFont) fonts.push({ name: "Syne", data: displayFont, weight: 700, style: "normal" });
  if (bodyFont) fonts.push({ name: "Space Grotesk", data: bodyFont, weight: 500, style: "normal" });

  const html = cardHtml({ width, height, title, subtitle, badge, imageDataUri });

  const png = new ImageResponse(html, { width, height, fonts });

  // WhatsApp/Telegram/Facebook's crawlers re-fetch an unfurl's og:image on
  // every share and every re-open of an old chat — caching hard means a
  // trip plan's card is rendered once (satori+resvg is real CPU work) and
  // served from Cloudflare's edge for everyone after that. A trip plan's
  // content is fixed once created (title, cover photo), so a day is safe;
  // finalizing doesn't change this endpoint's params for an already-shared
  // link, only what a *new* share of the same link would ask for next.
  const response = new Response(png.body, png);
  response.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  response.headers.set("content-type", "image/png");
  return response;
}
