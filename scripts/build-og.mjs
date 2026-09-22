import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fontsDir = path.join(root, "public", "fonts");
const outFile = path.join(root, "public", "og.png");

const BG = "#0A1628";
const INK = "#EEF2F7";
const MUTED = "#A3AFC2";
const ACCENT = "#F5B700";

const MARK_PATH = `<path d="M18 11V6M24 11V6M30 11V6M18 42V37M24 42V37M30 42V37M11 18H6M11 24H6M11 30H6M42 18H37M42 24H37M42 30H37"/><path d="M30.5 20.3A7.5 7.5 0 1 0 31.1 26.6"/><path d="M27.7 27.9L31.2 26.4L32.7 29.9"/>`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <g transform="translate(100,96) scale(2.2)" fill="none" stroke="${ACCENT}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="11" y="11" width="26" height="26" rx="6"/>
    ${MARK_PATH}
  </g>
  <text x="100" y="290" font-family="Manrope" font-weight="800" font-size="76" fill="${INK}">Hardware Club</text>
  <text x="100" y="360" font-family="Inter" font-weight="500" font-size="30" letter-spacing="1" fill="${ACCENT}">INDEPENDENT HARDWARE REUSE · METRO DETROIT</text>
  <text x="100" y="430" font-family="Manrope" font-weight="700" font-size="40" fill="${MUTED}">Old tech, new purpose.</text>
</svg>
`;

const [manropeFont, interFont] = await Promise.all([
  readFile(path.join(fontsDir, "manrope-latin.woff2")),
  readFile(path.join(fontsDir, "inter-latin.woff2")),
]);

const resvg = new Resvg(svg, {
  font: {
    fontBuffers: [manropeFont, interFont],
    loadSystemFonts: false,
  },
});

const png = resvg.render().asPng();
await writeFile(outFile, png);
console.log(`Wrote ${path.relative(root, outFile)} (${png.length} bytes)`);
