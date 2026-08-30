// Renders the static share card at landing/og.png.
//
// WHY A STATIC FILE AND NOT THE FUNCTION
// --------------------------------------
// `functions/api/og-image.js` renders this same card at request time, and for a
// while every page's `og:image` pointed straight at it. That works on Cloudflare
// Pages and only on Cloudflare Pages. The site is currently served from GitHub
// Pages (`letsgolighthouse.co.in` resolves to github.io — verified live), where
// `functions/` never executes and `_redirects` is an inert text file, so
// `/api/og-image` answered 404 and every WhatsApp/Twitter/LinkedIn unfurl of the
// homepage came back as bare text with no thumbnail.
//
// A share card is a growth surface (ADDENDUM §C.2), so it cannot depend on which
// host happens to be serving today. This script bakes the same design to a plain
// file that any static host will serve. The Function stays — it is still the
// right tool for per-trip-plan cards in `go.js`, where the title and photo differ
// per link and a static file cannot help.
//
// RUN IT:  node scripts/render-og.mjs      (from landing/)
// Re-run after changing the copy, the background still, or the brand palette.
//
// No new dependency: satori and @resvg/resvg-wasm are already in node_modules as
// `workers-og`'s own deps, which is the same engine pair the Function uses — so
// the static card and the dynamic card come out of the same renderer rather than
// two lookalikes that drift.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

import { encodePalettedPng } from "./png-encode.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LANDING = path.resolve(HERE, "..");
const CACHE = path.join(HERE, ".cache");

const WIDTH = 1200;
const HEIGHT = 630;

// Brand constitution (root CLAUDE.md). No other accent hues.
const BASE = "#0F0F12";
const MINT = "#5DCAA5";
const AMBER = "#E0A458";
const PAPER = "#F2F4F2";

// The card's copy. Deliberately the hero's own promise rather than a tagline
// invented for the card — someone who taps through from a WhatsApp unfurl should
// land on the sentence they just read.
const BADGE = "WEEKEND TRAVEL · AROUND BANGALORE";
const TITLE_A = "Your next road trip";
const TITLE_B = "is a swipe away.";
const SUBTITLE =
  "Hundreds of weekend places around Bangalore — waterfalls, forts, sunrise drives. Drive time already on the card.";
const URL_LINE = "letsgolighthouse.co.in";

// The hero's own map still: the product's actual first frame, pins and drive-time
// bubble included. It is the map that carries the pitch, so a photograph of one
// waterfall would say strictly less. Its tiles are OSM, hence the attribution
// line the card renders bottom-right — ODbL, same as the hero's own credit.
const BACKGROUND = path.join(LANDING, "assets/hero/map-still.png");
const ATTRIBUTION = "© OpenStreetMap contributors";

/* ------------------------------------------------------------------ fonts -- */

// Satori parses TTF/OTF/WOFF but not WOFF2, and Google's css2 endpoint decides
// which to serve from the User-Agent: a modern UA gets woff2, an ancient one gets
// TTF. Hence the deliberately old Chrome string — the standard trick for every
// Satori-based renderer, and the same one the Function uses.
const OLD_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";

async function loadFont(family, weight) {
  const slug = `${family.replace(/\s+/g, "-").toLowerCase()}-${weight}.ttf`;
  const cached = path.join(CACHE, slug);
  if (existsSync(cached)) return readFile(cached);

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}`;
  const css = await fetch(cssUrl, { headers: { "User-Agent": OLD_CHROME } }).then((r) => {
    if (!r.ok) throw new Error(`${family} ${weight}: font CSS ${r.status}`);
    return r.text();
  });

  // Google answers with one @font-face per unicode-range — cyrillic, greek,
  // vietnamese, latin-ext, latin — and latin is *last*, not first. Taking the
  // first url renders this whole card as tofu boxes with a stray capital A where
  // the Cyrillic А happened to line up; caught on the first render, not reasoned
  // about. So: pick the block whose range covers Basic Latin.
  const blocks = css.split("@font-face").filter((b) => b.includes("url("));
  const latin =
    blocks.find((b) => /unicode-range:[^;]*U\+0000-00FF/i.test(b)) || blocks[blocks.length - 1];
  const src = latin?.match(/url\((https:[^)]+\.(?:ttf|otf|woff))\)/)?.[1];
  if (!src) throw new Error(`${family} ${weight}: no ttf/otf/woff in Google's CSS`);

  const bytes = Buffer.from(await fetch(src).then((r) => r.arrayBuffer()));
  await mkdir(CACHE, { recursive: true });
  await writeFile(cached, bytes);
  return bytes;
}

/* ------------------------------------------------------------- background -- */

/**
 * Reads the still as a data URI plus its real pixel size.
 *
 * The MIME is sniffed from the magic bytes rather than taken from the file
 * extension, because `assets/hero/map-still.png` is in fact a JPEG wearing a
 * `.png` name — trusting the extension hands Satori a `data:image/png` header
 * over JPEG bytes and the background silently drops out of the card.
 */
async function loadBackground(file) {
  const buf = await readFile(file);

  const isPng = buf.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  if (!isPng && !isJpeg) throw new Error(`${file}: not a PNG or JPEG`);

  let width;
  let height;
  if (isPng) {
    const ihdr = buf.indexOf("IHDR");
    width = buf.readUInt32BE(ihdr + 4);
    height = buf.readUInt32BE(ihdr + 8);
  } else {
    // Walk the JPEG marker chain to the first SOF frame header, which is where
    // the dimensions live. Skipping the restart/standalone markers matters —
    // reading a fixed offset lands in the middle of a JFIF APP0 segment.
    for (let i = 2; i < buf.length; ) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        height = buf.readUInt16BE(i + 5);
        width = buf.readUInt16BE(i + 7);
        break;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (!width || !height) throw new Error(`${file}: could not read dimensions`);

  const mime = isPng ? "image/png" : "image/jpeg";
  return { uri: `data:${mime};base64,${buf.toString("base64")}`, width, height };
}

/* ---------------------------------------------------------------- the card -- */

const el = (type, style, children) => ({ type, props: { style, children } });
const text = (style, value) => ({ type: "div", props: { style: { display: "flex", ...style }, children: value } });

function card({ background }) {
  // Cover-crop by hand rather than leaning on `object-fit`: the geometry is a few
  // lines and it renders identically on every Satori version, which matters for a
  // file regenerated months apart.
  //
  // ZOOM overshoots the cover fit deliberately. At a plain 1.0 cover the still's
  // own app chrome — the coordinate readout and the "Overnight" chip it was
  // captured with — sits inside the top edge and reads as a rendering artifact.
  // Overscanning crops that row away and pushes the pin cluster off the type's
  // side of the card at the same time. FOCUS is the point of the source that
  // lands at the card's centre, in 0-1 source coordinates.
  const ZOOM = 1.5;
  const FOCUS = { x: 0.34, y: 0.66 };

  const scale = Math.max(WIDTH / background.width, HEIGHT / background.height) * ZOOM;
  const drawW = Math.round(background.width * scale);
  const drawH = Math.round(background.height * scale);
  // Clamped so overscanning can never expose a bare edge.
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const drawX = Math.round(clamp(WIDTH / 2 - drawW * FOCUS.x, WIDTH - drawW, 0));
  const drawY = Math.round(clamp(HEIGHT / 2 - drawH * FOCUS.y, HEIGHT - drawH, 0));

  const PAD = 68;

  return el("div", { display: "flex", position: "relative", width: WIDTH, height: HEIGHT, backgroundColor: BASE, fontFamily: "Space Grotesk" }, [
    // The map still, centred and cropped to fill.
    {
      type: "img",
      props: {
        src: background.uri,
        width: drawW,
        height: drawH,
        style: { position: "absolute", left: drawX, top: drawY },
      },
    },

    // Two scrims, not one. The vertical pass is the usual legibility bed the
    // app's sticky footers use. The horizontal pass is what makes the card
    // compose: it sinks the left third — where all the type lives — almost to
    // base black and lets the map stay legible on the right, so the two halves
    // stop fighting for the same attention. Stacked as separate layers because
    // one is a gradient in each axis, not a single ramp.
    el("div", {
      position: "absolute",
      inset: 0,
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      backgroundImage:
        "linear-gradient(to top, rgba(8,9,11,0.94) 0%, rgba(8,9,11,0.80) 32%, rgba(8,9,11,0.46) 66%, rgba(8,9,11,0.60) 100%)",
    }, undefined),
    el("div", {
      position: "absolute",
      inset: 0,
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      backgroundImage:
        "linear-gradient(to right, rgba(8,9,11,0.90) 0%, rgba(8,9,11,0.72) 38%, rgba(8,9,11,0.12) 74%, rgba(8,9,11,0.30) 100%)",
    }, undefined),

    // The beacon: two concentric rings bleeding off the top-right corner. The
    // sonar motif the whole product uses for "something here matters" — a quiet
    // corner accent, not a logo lockup.
    el("div", {
      position: "absolute",
      top: -108,
      right: -108,
      width: 340,
      height: 340,
      display: "flex",
      borderRadius: 9999,
      border: `2px solid rgba(93,202,165,0.13)`,
    }, undefined),
    el("div", {
      position: "absolute",
      top: -60,
      right: -60,
      width: 244,
      height: 244,
      display: "flex",
      borderRadius: 9999,
      border: `2px solid rgba(93,202,165,0.22)`,
    }, undefined),

    // Wordmark.
    el("div", { position: "absolute", top: PAD, left: PAD, display: "flex", alignItems: "center" }, [
      el("div", {
        width: 13,
        height: 13,
        display: "flex",
        borderRadius: 9999,
        backgroundColor: MINT,
        boxShadow: `0 0 26px ${MINT}`,
        marginRight: 16,
      }, undefined),
      text({ fontSize: 22, fontWeight: 500, letterSpacing: "0.34em", color: "rgba(255,255,255,0.88)" }, "LIGHTHOUSE"),
    ]),

    // The pitch block, bottom-left.
    el("div", {
      position: "absolute",
      left: PAD,
      bottom: PAD,
      display: "flex",
      flexDirection: "column",
      maxWidth: WIDTH - PAD * 2,
    }, [
      el("div", {
        display: "flex",
        alignSelf: "flex-start",
        alignItems: "center",
        padding: "9px 20px",
        marginBottom: 26,
        borderRadius: 9999,
        border: "1.5px solid rgba(224,164,88,0.55)",
        backgroundColor: "rgba(224,164,88,0.14)",
      }, [
        // Satori has no `text-transform`, so the caps are baked into the string.
        text({ fontSize: 17, fontWeight: 500, letterSpacing: "0.17em", color: AMBER }, BADGE),
      ]),

      text({ fontFamily: "Syne", fontSize: 82, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.02em", color: PAPER }, TITLE_A),
      text({ fontFamily: "Syne", fontSize: 82, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.02em", color: MINT }, TITLE_B),

      text({ marginTop: 24, maxWidth: 800, fontSize: 25, lineHeight: 1.42, color: "rgba(242,244,242,0.74)" }, SUBTITLE),

      text({ marginTop: 30, fontSize: 20, letterSpacing: "0.1em", color: "rgba(93,202,165,0.85)" }, URL_LINE),
    ]),

    // ODbL credit for the tiles under the still.
    text({
      position: "absolute",
      right: PAD,
      bottom: 30,
      fontSize: 14,
      letterSpacing: "0.04em",
      color: "rgba(242,244,242,0.34)",
    }, ATTRIBUTION),
  ]);
}

/* ------------------------------------------------------------------- main -- */

const [syne, grotesk, background] = await Promise.all([
  loadFont("Syne", 700),
  loadFont("Space Grotesk", 500),
  loadBackground(BACKGROUND),
]);

const svg = await satori(card({ background }), {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: "Syne", data: syne, weight: 700, style: "normal" },
    { name: "Space Grotesk", data: grotesk, weight: 500, style: "normal" },
  ],
});

await initWasm(await readFile(path.join(LANDING, "node_modules/@resvg/resvg-wasm/index_bg.wasm")));

const rendered = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render();

// Paletted rather than resvg's own 24-bit PNG — see png-encode.mjs for why the
// byte count is a product requirement here and not a micro-optimisation.
const png = encodePalettedPng(rendered.pixels, rendered.width, rendered.height, {
  colors: 256,
  matte: [0x0f, 0x0f, 0x12],
});

const out = path.join(LANDING, "og.png");
await writeFile(out, png);
console.log(`og.png  ${WIDTH}x${HEIGHT}  ${(png.length / 1024).toFixed(1)} KB  ->  ${out}`);
