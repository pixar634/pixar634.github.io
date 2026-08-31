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
// Re-run after changing the copy, the air map still, or the brand palette.
// The card is the landing's air theme: cream paper, ink type, terracotta pop.
//
// No new dependency: satori and @resvg/resvg-wasm are already in node_modules as
// `workers-og`'s own deps, which is the same engine pair the Function uses — so
// the static card and the dynamic card come out of the same renderer rather than
// two lookalikes that drift.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
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

// Air theme — the live landing default. Cream paper, ink type, terracotta pop.
const CREAM = "#F4F1EA";
const INK = "#1C1915";
const TERRACOTTA = "#A83F1C";
const TERRACOTTA_SOFT = "#E8916A";

// The card's copy. Deliberately the hero's own promise rather than a tagline
// invented for the card — someone who taps through from a WhatsApp unfurl should
// land on the sentence they just read.
const BADGE = "WEEKEND TRAVEL · AROUND BANGALORE";
const URL_LINE = "letsgolighthouse.co.in";

// The hero's own map still: the product's actual first frame, pins and drive-time
// bubble included. It is the map that carries the pitch, so a photograph of one
// waterfall would say strictly less. Its tiles are OSM, hence the attribution
// line the card renders bottom-right — ODbL, same as the hero's own credit.
const BACKGROUND = path.join(LANDING, "assets/hero/map-still-air.jpg");
const ATTRIBUTION = "© OpenStreetMap contributors";
const PLACES = path.join(LANDING, "assets/places");
const NAMED_PIN = { file: "skandagiri.jpg", name: "Skandagiri", meta: "1h 2m · 60 km" };
const BUBBLE_PINS = [
  "makalidurga.jpg",
  "savandurga.jpg",
  "rayakottai.jpg",
  "gundamagere.jpg",
  "devarayanadurga.jpg",
];

/* ------------------------------------------------------------------ fonts -- */

/**
 * Satori wants TTF; the landing ships Nohemi as woff2. Decompress into
 * scripts/.cache the same way Google fonts used to be cached — build input, not source.
 */
async function loadNohemi(weightName) {
  await mkdir(CACHE, { recursive: true });
  const ttf = path.join(CACHE, `Nohemi-${weightName}.ttf`);
  if (!existsSync(ttf)) {
    const woff2 = path.join(LANDING, "fonts", `Nohemi-${weightName}.woff2`);
    const py = spawnSync(
      "python",
      ["-c", "from fontTools.ttLib.woff2 import decompress; import sys; decompress(sys.argv[1], sys.argv[2])", woff2, ttf],
      { encoding: "utf8" },
    );
    if (py.status !== 0) {
      throw new Error(`Nohemi ${weightName}: ${py.stderr || py.stdout || "woff2 decompress failed"}`);
    }
  }
  return readFile(ttf);
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

async function loadPlace(file) {
  const { uri } = await loadBackground(path.join(PLACES, file));
  return uri;
}

/* ---------------------------------------------------------------- the card -- */

const el = (type, style, children) => ({ type, props: { style, children } });
const text = (style, value) => ({ type: "div", props: { style: { display: "flex", ...style }, children: value } });

function words(size, parts, extra = {}) {
  return el("div", {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "baseline",
    gap: Math.round(size * 0.22),
    ...extra,
  }, parts.map(([value, weight, color]) =>
    text({
      fontFamily: "Nohemi",
      fontSize: size,
      fontWeight: weight,
      lineHeight: extra.lineHeight || 0.96,
      letterSpacing: extra.letterSpacing || "-0.04em",
      color: color || INK,
    }, value),
  ));
}

function pinDot(uri, size) {
  return el("div", {
    width: size,
    height: size,
    display: "flex",
    borderRadius: 9999,
    overflow: "hidden",
    flexShrink: 0,
  }, [
    {
      type: "img",
      props: { src: uri, width: size, height: size, style: { objectFit: "cover" } },
    },
  ]);
}

function pinBubble(left, top, uri) {
  return el("div", {
    position: "absolute",
    left,
    top,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    backgroundColor: "#FFFCF7",
    border: "1.5px solid #BA5A36",
    boxShadow: "0 6px 18px rgba(28,25,21,0.14)",
  }, [pinDot(uri, 32)]);
}

function pinNamed(left, top, uri, name, meta) {
  return el("div", {
    position: "absolute",
    left,
    top,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    padding: "0 16px 0 5px",
    borderRadius: 9999,
    backgroundColor: "#FFFCF7",
    border: "1.5px solid #BA5A36",
    boxShadow: "0 10px 24px rgba(28,25,21,0.14)",
  }, [
    pinDot(uri, 40),
    el("div", { display: "flex", flexDirection: "column", justifyContent: "center" }, [
      text({ fontSize: 15, fontWeight: 600, lineHeight: 1.1, color: INK, letterSpacing: 0 }, name),
      text({ fontSize: 12, fontWeight: 400, lineHeight: 1.2, color: "#3F3A36", letterSpacing: 0 }, meta),
    ]),
  ]);
}

function card({ background, named, bubbles }) {
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
  // Cluster still: named Skandagiri sits upper-centre. Keep it on the right
  // of the card so the four-line lockup has the left third.
  const ZOOM = 1.1;
  const FOCUS = { x: 0.78, y: 0.46 };

  const scale = Math.max(WIDTH / background.width, HEIGHT / background.height) * ZOOM;
  const drawW = Math.round(background.width * scale);
  const drawH = Math.round(background.height * scale);
  // Clamped so overscanning can never expose a bare edge.
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const drawX = Math.round(clamp(WIDTH / 2 - drawW * FOCUS.x, WIDTH - drawW, 0));
  const drawY = Math.round(clamp(HEIGHT / 2 - drawH * FOCUS.y, HEIGHT - drawH, 0));

  const PAD = 68;

  return el("div", { display: "flex", position: "relative", width: WIDTH, height: HEIGHT, backgroundColor: CREAM, fontFamily: "Nohemi" }, [
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
        "linear-gradient(to top, rgba(244,241,234,0.88) 0%, rgba(244,241,234,0.42) 28%, rgba(244,241,234,0.08) 62%, rgba(244,241,234,0.35) 100%)",
    }, undefined),
    el("div", {
      position: "absolute",
      inset: 0,
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      backgroundImage:
        "linear-gradient(to right, rgba(244,241,234,0.92) 0%, rgba(244,241,234,0.62) 32%, rgba(244,241,234,0.04) 58%, rgba(244,241,234,0.08) 100%)",
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
      border: `2px solid rgba(168,63,28,0.14)`,
    }, undefined),
    el("div", {
      position: "absolute",
      top: -60,
      right: -60,
      width: 244,
      height: 244,
      display: "flex",
      borderRadius: 9999,
      border: `2px solid rgba(168,63,28,0.24)`,
    }, undefined),

    // Wordmark.
    el("div", { position: "absolute", top: PAD, left: PAD, display: "flex", alignItems: "center" }, [
      el("div", {
        width: 13,
        height: 13,
        display: "flex",
        borderRadius: 9999,
        backgroundColor: TERRACOTTA,
        boxShadow: `0 0 22px rgba(168,63,28,0.35)`,
        marginRight: 16,
      }, undefined),
      text({ fontSize: 22, fontWeight: 500, letterSpacing: "0.34em", color: INK }, "LIGHTHOUSE"),
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
        border: "1.5px solid rgba(168,63,28,0.45)",
        backgroundColor: "rgba(168,63,28,0.08)",
      }, [
        // Satori has no `text-transform`, so the caps are baked into the string.
        text({ fontSize: 17, fontWeight: 500, letterSpacing: "0.17em", color: TERRACOTTA }, BADGE),
      ]),

      // Same lockup as the live hero — Nohemi Thin / Medium / ExtraBold / ExtraLight / Light.
      // Sized so "Road Trip" occupies about half the card, not a left-third column.
      words(82, [["Your", 100], ["Next", 500]]),
      words(88, [["Road", 800], ["Trip", 800]], { marginTop: 4 }),
      words(50, [["destination", 200], ["Discovery", 800]], { marginTop: 12, letterSpacing: "-0.038em", lineHeight: 1.08 }),
      words(44, [["is a", 300], ["swipe", 800, TERRACOTTA], ["away.", 400]], { marginTop: 10, lineHeight: 1.02 }),

      text({ marginTop: 28, fontSize: 20, fontWeight: 500, letterSpacing: "0.1em", color: TERRACOTTA_SOFT }, URL_LINE),
    ]),

    // Product pins sit on the open right half — one named chip, five photo
    // bubbles. Painted here rather than trusted to the still's crop, which
    // kept leaving that side empty.
    pinNamed(798, 178, named.uri, named.name, named.meta),
    pinBubble(704, 112, bubbles[0]),
    pinBubble(918, 96, bubbles[1]),
    pinBubble(1072, 168, bubbles[2]),
    pinBubble(948, 312, bubbles[3]),
    pinBubble(1096, 398, bubbles[4]),

    // ODbL credit for the tiles under the still.
    text({
      position: "absolute",
      right: PAD,
      bottom: 30,
      fontSize: 14,
      letterSpacing: "0.04em",
      color: "rgba(28,25,21,0.38)",
    }, ATTRIBUTION),
  ]);
}

/* ------------------------------------------------------------------- main -- */

const [nohemiThin, nohemiExtraLight, nohemiLight, nohemiRegular, nohemiMedium, nohemiExtraBold, background, namedUri, ...bubbleUris] = await Promise.all([
  loadNohemi("Thin"),
  loadNohemi("ExtraLight"),
  loadNohemi("Light"),
  loadNohemi("Regular"),
  loadNohemi("Medium"),
  loadNohemi("ExtraBold"),
  loadBackground(BACKGROUND),
  loadPlace(NAMED_PIN.file),
  ...BUBBLE_PINS.map(loadPlace),
]);

const svg = await satori(card({
  background,
  named: { uri: namedUri, name: NAMED_PIN.name, meta: NAMED_PIN.meta },
  bubbles: bubbleUris,
}), {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: "Nohemi", data: nohemiThin, weight: 100, style: "normal" },
    { name: "Nohemi", data: nohemiExtraLight, weight: 200, style: "normal" },
    { name: "Nohemi", data: nohemiLight, weight: 300, style: "normal" },
    { name: "Nohemi", data: nohemiRegular, weight: 400, style: "normal" },
    { name: "Nohemi", data: nohemiMedium, weight: 500, style: "normal" },
    { name: "Nohemi", data: nohemiExtraBold, weight: 800, style: "normal" },
  ],
});

await initWasm(await readFile(path.join(LANDING, "node_modules/@resvg/resvg-wasm/index_bg.wasm")));

const rendered = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render();

// Paletted rather than resvg's own 24-bit PNG — see png-encode.mjs for why the
// byte count is a product requirement here and not a micro-optimisation.
const png = encodePalettedPng(rendered.pixels, rendered.width, rendered.height, {
  colors: 256,
  matte: [0xf4, 0xf1, 0xea],
});

const out = path.join(LANDING, "og.png");
await writeFile(out, png);
console.log(`og.png  ${WIDTH}x${HEIGHT}  ${(png.length / 1024).toFixed(1)} KB  ->  ${out}`);
