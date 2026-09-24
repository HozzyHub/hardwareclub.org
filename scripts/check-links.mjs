import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(root, "public");

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (entry.name.endsWith(".html")) files.push(path.join(dir, entry.name));
  }
  return files;
}

async function fileExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function extractAttrValues(html, attr) {
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, "g");
  const values = [];
  let match;
  while ((match = re.exec(html))) {
    values.push(match[1]);
  }
  return values;
}

function isExternal(href) {
  return /^([a-z][a-z0-9+.-]*:)/i.test(href);
}

async function resolveInternalPath(pathname) {
  if (pathname === "" || pathname === "/") {
    return path.join(publicDir, "index.html");
  }
  const clean = pathname.replace(/^\//, "");
  const direct = path.join(publicDir, clean);
  if (await fileExists(direct)) {
    const info = await stat(direct);
    if (info.isFile()) return direct;
  }
  const withHtml = `${direct}.html`;
  if (await fileExists(withHtml)) return withHtml;
  return null;
}

async function idsInFile(filePath, cache) {
  if (cache.has(filePath)) return cache.get(filePath);
  const html = await readFile(filePath, "utf8");
  const ids = new Set(extractAttrValues(html, "id"));
  cache.set(filePath, ids);
  return ids;
}

async function main() {
  const htmlFiles = await listHtmlFiles(publicDir);
  const idCache = new Map();
  const errors = [];

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const ownIds = await idsInFile(file, idCache);
    const links = [
      ...extractAttrValues(html, "href"),
      ...extractAttrValues(html, "src"),
    ];

    for (const link of links) {
      if (!link || link.startsWith("mailto:") || link.startsWith("tel:") || isExternal(link)) {
        continue;
      }

      if (link.startsWith("#")) {
        const id = link.slice(1);
        if (id && !ownIds.has(id)) {
          errors.push(`${path.relative(root, file)}: broken anchor "${link}" (no id="${id}")`);
        }
        continue;
      }

      const [pathname, fragment] = link.split("#");

      const targetFile = pathname ? await resolveInternalPath(pathname) : file;
      if (!targetFile) {
        errors.push(`${path.relative(root, file)}: broken link "${link}" (no matching file)`);
        continue;
      }

      if (fragment && targetFile.endsWith(".html")) {
        const targetIds = await idsInFile(targetFile, idCache);
        if (!targetIds.has(fragment)) {
          errors.push(
            `${path.relative(root, file)}: broken anchor "${link}" (no id="${fragment}" in ${path.relative(root, targetFile)})`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Link check failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }

  console.log(`Link check passed (${htmlFiles.length} pages).`);
}

main();
