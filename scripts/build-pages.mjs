// Generates every templated page (/resources, /blog, /security), extra files
// such as downloads and feeds, and sitemap.xml from the modules listed in
// scripts/site/registry.mjs. Output is committed under public/.
// Run via `npm run build` (or `node scripts/build-pages.mjs`).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { modules } from "./site/registry.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(root, "public");
const ORIGIN = "https://hardwareclub.org";

const MARK = `<svg class="mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="11" y="11" width="26" height="26" rx="6"/><path d="M18 11V6M24 11V6M30 11V6M18 42V37M24 42V37M30 42V37M11 18H6M11 24H6M11 30H6M42 18H37M42 24H37M42 30H37"/><path d="M30.5 20.3A7.5 7.5 0 1 0 31.1 26.6"/><path d="M27.7 27.9L31.2 26.4L32.7 29.9"/></svg>`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Top-level sections: each has a hub page at its own URL (written to <name>.html).
const SECTIONS = { "/resources": "Resources", "/blog": "Blog", "/security": "Security" };
const sectionOf = (url) => "/" + url.split("/")[1];

function crumbs(page) {
  const top = sectionOf(page.url);
  if (page.url === top || !SECTIONS[top]) return "";
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${top}">${SECTIONS[top]}</a> <span aria-hidden="true">/</span> <span>${page.crumb}</span></nav>`;
}

const navLink = (page, href, label) =>
  `<a class="nav-link" href="${href}"${sectionOf(page.url) === href ? ' aria-current="page"' : ""}>${label}</a>`;

function render(page) {
  const url = `${ORIGIN}${page.url}`;
  const title = `${page.title} · Hardware Club`;
  const scripts = page.script ? `<script src="${page.script}" defer></script>\n` : "";
  const ld = page.jsonld
    ? `<script type="application/ld+json">\n${JSON.stringify(page.jsonld, null, 2)}\n</script>\n`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#07050c">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${page.ogType ?? "website"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Hardware Club: old tech, new purpose.">
<meta property="og:site_name" content="Hardware Club">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${ORIGIN}/og.png">
<meta name="twitter:image:alt" content="Hardware Club: old tech, new purpose.">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico">
<link rel="stylesheet" href="/styles.css">
<link rel="alternate" type="application/atom+xml" title="Hardware Club blog" href="/blog/feed.xml">
${page.head ?? ""}${ld}</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-nav">
  <div class="container">
    <a class="brand" href="/">
      ${MARK}
      <span>Hardware Club</span>
    </a>
    <nav class="nav-links" aria-label="Primary">
      ${navLink(page, "/resources", "Resources")}
      ${navLink(page, "/security", "Security")}
      ${navLink(page, "/blog", "Blog")}
      <a class="btn btn-primary" href="/#donate">Donate hardware</a>
    </nav>
  </div>
</header>
<main id="main" class="resource-page${page.mainClass ? " " + page.mainClass : ""}">
  <div class="container">
    ${crumbs(page)}
    <p class="eyebrow">${page.eyebrow}</p>
    <h1>${page.h1}</h1>
    ${page.lede ? `<p class="lede">${page.lede}</p>` : ""}
${page.body}
  </div>
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-brand">
      ${MARK}
      <span>Hardware Club · an independent project in Metro Detroit · hello@hardwareclub.org</span>
    </div>
    <div class="footer-links">
      <a href="/resources">Resources</a>
      <a href="/security">Security</a>
      <a href="/blog">Blog</a>
      <a href="/blog/feed.xml">RSS</a>
      <a href="/privacy">Privacy</a>
    </div>
  </div>
</footer>
${scripts}</body>
</html>
`;
}

async function write(rel, content) {
  const file = path.join(publicDir, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content.replace(/[ \t]+$/gm, ""));
}

const pages = modules.flatMap((m) => m.pages ?? []);
const files = modules.flatMap((m) => m.files ?? []);

const seen = new Set();
for (const page of pages) {
  if (seen.has(page.url)) throw new Error(`Duplicate page URL ${page.url}`);
  seen.add(page.url);
  await write(`${page.url.slice(1)}.html`, render(page));
}
// files: [{ path: "blog/feed.xml", content: "..." }], paths relative to public/
for (const f of files) {
  await write(f.path, f.content);
}

const urls = ["/", "/privacy", ...pages.filter((p) => p.sitemap !== false).map((p) => p.url)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${ORIGIN}${u}</loc>\n  </url>`).join("\n")}
</urlset>
`;
await write("sitemap.xml", sitemap);

console.log(`Generated ${pages.length} pages, ${files.length} extra files, sitemap.`);
