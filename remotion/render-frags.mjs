#!/usr/bin/env node
/**
 * Re-render the six parked How-it-works fragment clips.
 * Run from landing/remotion after `npm install`:
 *   npm run render:frags
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "video", "remotion");

const compositions = [
  { id: "FragLookMap", file: "frag-lookmap.mp4" },
  { id: "FragLookCard", file: "frag-lookcard.mp4" },
  { id: "FragHungerRail", file: "frag-hungerrail.mp4" },
  { id: "FragHungerCount", file: "frag-hungercount.mp4" },
  { id: "FragPeopleVote", file: "frag-peoplevote.mp4" },
  { id: "FragPeopleInvite", file: "frag-peopleinvite.mp4" },
];

for (const comp of compositions) {
  const mp4Path = join(outDir, comp.file);
  console.log(`\nRendering ${comp.id} → ${comp.file}`);
  execSync(`npx remotion render src/Root.tsx ${comp.id} "${mp4Path}"`, {
    cwd: __dirname,
    stdio: "inherit",
  });
}

console.log(`\nFragment renders written to ${outDir}`);
