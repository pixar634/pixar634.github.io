// An 8-bit paletted PNG encoder with median-cut quantization.
//
// WHY: resvg hands back a 24-bit PNG, and this card — a map still under two
// gradient scrims — comes out around 475 KB that way. WhatsApp is the sharing
// surface this product actually lives on (MARKETING §4, the Reel Loop), and its
// link-preview fetcher gives up on an og:image well before that, which means the
// homepage would still unfurl as bare text on the one platform that matters most.
// Quantized to 256 colours the same card is ~200 KB with no visible banding —
// compared against the 24-bit render side by side, not assumed.
//
// WHY BY HAND: `landing/` is deliberately a zero-build directory with a single
// npm dependency, and every alternative here is a native binary (sharp) or another
// tree of packages. PNG's paletted form is IHDR + PLTE + IDAT + IEND, and Node's
// own zlib does the deflate and the CRC — so this costs no dependency at all.

import zlib from "node:zlib";

/* ------------------------------------------------------------ median cut -- */

/**
 * Classic median cut: start with every distinct colour in one box, then keep
 * splitting whichever box spans the most colour volume along its own longest
 * axis, at the population-weighted median, until there are `count` boxes. Each
 * box collapses to the weighted average of the colours inside it.
 *
 * Weighting the split by pixel population rather than by distinct-colour count
 * is what keeps the dark field — which is most of this card's area but very few
 * of its distinct colours — from being handed a single palette entry and banding.
 */
function medianCut(colors, counts, wanted) {
  let boxes = [{ lo: 0, hi: colors.length }];

  // Sorting happens per split, over the box's own slice, so the arrays are
  // shuffled in place together and a box is only ever a contiguous range.
  const order = Uint32Array.from(colors.keys());

  const channel = (i, ch) => (colors[order[i]] >> (16 - ch * 8)) & 0xff;

  const rangeOf = (box) => {
    const min = [255, 255, 255];
    const max = [0, 0, 0];
    let pop = 0;
    for (let i = box.lo; i < box.hi; i++) {
      pop += counts[order[i]];
      for (let ch = 0; ch < 3; ch++) {
        const v = channel(i, ch);
        if (v < min[ch]) min[ch] = v;
        if (v > max[ch]) max[ch] = v;
      }
    }
    // Rec. 601-ish weighting: the eye reads green detail hardest, so a green
    // spread is worth splitting before an equal blue one.
    const spread = [(max[0] - min[0]) * 0.30, (max[1] - min[1]) * 0.59, (max[2] - min[2]) * 0.11];
    const axis = spread.indexOf(Math.max(...spread));
    return { axis, score: Math.max(...spread) * Math.log2(pop + 1), pop };
  };

  for (const box of boxes) Object.assign(box, rangeOf(box));

  while (boxes.length < wanted) {
    // Only boxes with more than one colour can split.
    const splittable = boxes.filter((b) => b.hi - b.lo > 1);
    if (!splittable.length) break;
    const box = splittable.reduce((a, b) => (b.score > a.score ? b : a));

    const slice = Array.from(order.subarray(box.lo, box.hi));
    slice.sort((a, b) => ((colors[a] >> (16 - box.axis * 8)) & 0xff) - ((colors[b] >> (16 - box.axis * 8)) & 0xff));
    order.set(slice, box.lo);

    // Cut where half the *pixels* fall, not half the distinct colours.
    let half = box.pop / 2;
    let mid = box.lo;
    for (; mid < box.hi - 1; mid++) {
      half -= counts[order[mid]];
      if (half <= 0) break;
    }
    mid = Math.max(box.lo + 1, Math.min(mid + 1, box.hi - 1));

    const left = { lo: box.lo, hi: mid };
    const right = { lo: mid, hi: box.hi };
    Object.assign(left, rangeOf(left));
    Object.assign(right, rangeOf(right));
    boxes = boxes.filter((b) => b !== box).concat(left, right);
  }

  return boxes.map((box) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = box.lo; i < box.hi; i++) {
      const w = counts[order[i]];
      r += channel(i, 0) * w;
      g += channel(i, 1) * w;
      b += channel(i, 2) * w;
      n += w;
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

/* ------------------------------------------------------------------ chunk -- */

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

/* ----------------------------------------------------------------- encode -- */

/**
 * @param {Uint8Array} rgba   Raw RGBA, `width * height * 4` bytes.
 * @param {number} colors     Palette size, 2-256.
 * @param {[number,number,number]} matte  Composited under any transparency.
 */
export function encodePalettedPng(rgba, width, height, { colors = 256, matte = [0, 0, 0] } = {}) {
  const pixelCount = width * height;

  // Flatten to opaque RGB and histogram it in one pass.
  const rgb = new Uint8Array(pixelCount * 3);
  const hist = new Map();
  for (let p = 0; p < pixelCount; p++) {
    const a = rgba[p * 4 + 3] / 255;
    const r = Math.round(rgba[p * 4] * a + matte[0] * (1 - a));
    const g = Math.round(rgba[p * 4 + 1] * a + matte[1] * (1 - a));
    const b = Math.round(rgba[p * 4 + 2] * a + matte[2] * (1 - a));
    rgb[p * 3] = r;
    rgb[p * 3 + 1] = g;
    rgb[p * 3 + 2] = b;
    const key = (r << 16) | (g << 8) | b;
    hist.set(key, (hist.get(key) || 0) + 1);
  }

  const distinct = [...hist.keys()];
  const palette =
    distinct.length <= colors
      ? distinct.map((k) => [(k >> 16) & 0xff, (k >> 8) & 0xff, k & 0xff])
      : medianCut(distinct, distinct.map((k) => hist.get(k)), colors);

  // A 6-bit-per-channel nearest-entry lookup table. Built once (262k probes),
  // then every dithered pixel is one array read instead of a 256-entry scan —
  // the difference between a build step that takes a second and one that takes
  // a minute. At 64 levels per channel the approximation is finer than the
  // dither noise it feeds, so it costs nothing visible.
  const LUT_BITS = 6;
  const LUT_SIZE = 1 << LUT_BITS;
  const lut = new Uint8Array(LUT_SIZE ** 3);
  const step = 256 / LUT_SIZE;
  for (let r = 0; r < LUT_SIZE; r++) {
    for (let g = 0; g < LUT_SIZE; g++) {
      for (let b = 0; b < LUT_SIZE; b++) {
        const cr = r * step + step / 2;
        const cg = g * step + step / 2;
        const cb = b * step + step / 2;
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < palette.length; i++) {
          const dr = cr - palette[i][0];
          const dg = cg - palette[i][1];
          const db = cb - palette[i][2];
          const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        lut[(r << (LUT_BITS * 2)) | (g << LUT_BITS) | b] = best;
      }
    }
  }
  const nearest = (r, g, b) =>
    lut[
      ((Math.min(255, Math.max(0, r)) >> (8 - LUT_BITS)) << (LUT_BITS * 2)) |
        ((Math.min(255, Math.max(0, g)) >> (8 - LUT_BITS)) << LUT_BITS) |
        (Math.min(255, Math.max(0, b)) >> (8 - LUT_BITS))
    ];

  // Floyd-Steinberg, carried in a float buffer so the error accumulates at full
  // precision. Without it the two big scrim gradients band into visible steps —
  // which on a card that is 70% gradient is the whole ballgame.
  const err = new Float32Array(pixelCount * 3);
  // One filter byte (0 = None; paletted rows gain nothing from the other
  // filters, and None keeps the deflate stream simple) plus one index per pixel.
  const raw = Buffer.alloc(height * (1 + width));

  const spill = (p, dr, dg, db, w) => {
    if (p < 0 || p >= pixelCount) return;
    err[p * 3] += dr * w;
    err[p * 3 + 1] += dg * w;
    err[p * 3 + 2] += db * w;
  };

  for (let y = 0; y < height; y++) {
    raw[y * (1 + width)] = 0;
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const r = rgb[p * 3] + err[p * 3];
      const g = rgb[p * 3 + 1] + err[p * 3 + 1];
      const b = rgb[p * 3 + 2] + err[p * 3 + 2];
      const idx = nearest(r, g, b);
      raw[y * (1 + width) + 1 + x] = idx;

      const dr = r - palette[idx][0];
      const dg = g - palette[idx][1];
      const db = b - palette[idx][2];
      const last = x === width - 1;
      const first = x === 0;
      if (!last) spill(p + 1, dr, dg, db, 7 / 16);
      if (!first) spill(p + width - 1, dr, dg, db, 3 / 16);
      spill(p + width, dr, dg, db, 5 / 16);
      if (!last) spill(p + width + 1, dr, dg, db, 1 / 16);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // colour type 3 = palette
  // 10-12 stay zero: deflate, adaptive filtering, no interlace.

  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach((c, i) => {
    plte[i * 3] = c[0];
    plte[i * 3 + 1] = c[1];
    plte[i * 3 + 2] = c[2];
  });

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("PLTE", plte),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9, memLevel: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
