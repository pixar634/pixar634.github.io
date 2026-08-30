#!/usr/bin/env node
/**
 * Headless render script for the Lighthouse landing Remotion compositions.
 * Run from the landing/remotion/ directory after `npm install`:
 *   node render.mjs
 *
 * This script renders every composition to MP4 + WebM and writes a poster
 * frame (first frame) as a JPG for the static landing page to use as a
 * reduced-motion / lazy-load fallback.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "video", "remotion");

const compositions = [
  { id: "ExplorePeek", width: 390, height: 844 },
  { id: "HeroMorph", width: 1920, height: 1080 },
  { id: "ReelImport", width: 1080, height: 1080 },
  { id: "GroupVote", width: 390, height: 844 },
  { id: "AiScout", width: 1080, height: 1080 },
  { id: "Radar", width: 1080, height: 1080 },
  { id: "Weather", width: 1080, height: 1080 },
  { id: "Logistics", width: 1080, height: 1080 },
  { id: "CollectionsFriends", width: 1080, height: 1080 },
  { id: "ProUpgrade", width: 1080, height: 1080 },
];

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const comp of compositions) {
  const mp4Path = join(outDir, `${comp.id.toLowerCase()}.mp4`);
  const webmPath = join(outDir, `${comp.id.toLowerCase()}.webm`);
  const posterPath = join(outDir, `${comp.id.toLowerCase()}.jpg`);

  console.log(`\nRendering ${comp.id}…`);

  execSync(
    `npx remotion render src/Root.tsx ${comp.id} ${mp4Path} --log=verbose`,
    { cwd: __dirname, stdio: "inherit" }
  );

  // WebM render is optional; skip if it fails so the script stays resilient.
  try {
    execSync(
      `npx remotion render src/Root.tsx ${comp.id} ${webmPath} --codec=vp9 --log=verbose`,
      { cwd: __dirname, stdio: "inherit" }
    );
  } catch (e) {
    console.warn(`WebM render for ${comp.id} failed; MP4 is available.`, e.message);
  }

  // First-frame poster.
  try {
    execSync(
      `npx remotion still src/Root.tsx ${comp.id} ${posterPath} --frame=0`,
      { cwd: __dirname, stdio: "inherit" }
    );
  } catch (e) {
    console.warn(`Poster render for ${comp.id} failed.`, e.message);
  }
}

console.log(`\nAll renders written to ${outDir}`);
