/**
 * generate-icons.mjs
 *
 * Generates PWA and app-store icons from the master SVG.
 * Run once after design finalizes: node scripts/generate-icons.mjs
 *
 * Requires: pnpm add -D sharp
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../client/public/icons/icon.svg");
const OUT = path.resolve(__dirname, "../client/public/icons");

const SIZES = [
  { name: "icon-72.png",         size: 72  },
  { name: "icon-96.png",         size: 96  },
  { name: "icon-128.png",        size: 128 },
  { name: "icon-144.png",        size: 144 },
  { name: "icon-152.png",        size: 152 },
  { name: "icon-192.png",        size: 192 },
  { name: "icon-384.png",        size: 384 },
  { name: "icon-512.png",        size: 512 },
  { name: "apple-touch-icon.png",size: 180 },
  // App Store requires 1024×1024 — submit separately via Xcode / Play Console
  { name: "icon-1024.png",       size: 1024 },
];

for (const { name, size } of SIZES) {
  await sharp(SRC)
    .resize(size, size)
    .png()
    .toFile(path.join(OUT, name));
  console.log(`✓ ${name}`);
}

console.log("\nAll icons generated. Update vite.config.ts to reference PNG files if needed.");
