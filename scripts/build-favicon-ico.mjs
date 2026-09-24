import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

// One-off generator for public/favicon.ico from public/favicon.svg.
// Not part of the npm build; run manually if the mark ever changes.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svgPath = path.join(root, "public", "favicon.svg");
const outPath = path.join(root, "public", "favicon.ico");

const svg = await readFile(svgPath, "utf8");
const sizes = [16, 32, 48];

const pngs = sizes.map((size) => {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  return resvg.render().asPng();
});

// ICO container with embedded PNG images (supported since Windows Vista).
const headerSize = 6;
const entrySize = 16;
const dirSize = headerSize + entrySize * pngs.length;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4);

let offset = dirSize;
const entries = [];
for (let i = 0; i < pngs.length; i++) {
  const size = sizes[i];
  const png = pngs[i];
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += png.length;
}

const ico = Buffer.concat([header, ...entries, ...pngs]);
await writeFile(outPath, ico);
console.log(`Wrote ${path.relative(root, outPath)} (${ico.length} bytes)`);
