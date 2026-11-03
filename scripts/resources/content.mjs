// Content for the /resources section. HTML is written by hand here and
// rendered into pages by ../build-resources.mjs. Keep it free of inline
// style="" and inline <script>: the site CSP (src/security.ts) blocks both.
import { guides } from "./guides.mjs";
import { tools, directory, downloadsPage, downloadFiles } from "./other.mjs";

const REVIEWED = "November 2026";

function article(g) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.description,
    datePublished: "2026-11-03",
    author: { "@type": "Organization", name: "Hardware Club" },
    publisher: { "@type": "Organization", name: "Hardware Club", url: "https://hardwareclub.org/" },
    mainEntityOfPage: `https://hardwareclub.org/resources/${g.slug}`,
  };
}

const guidePages = guides.map((g) => ({
  url: `/resources/${g.slug}`,
  crumb: g.crumb,
  title: g.title,
  description: g.description,
  eyebrow: "Guide · " + g.level,
  h1: g.h1,
  lede: g.lede,
  jsonld: article(g),
  body: `${g.body}
    <p class="reviewed">Last reviewed ${REVIEWED}. Menu names and prices change; if something here no longer matches what you see, trust your device's own instructions and tell us at <a href="mailto:hello@hardwareclub.org">hello@hardwareclub.org</a>.</p>
    <aside class="note-card">
      <strong>Have hardware you're done with?</strong> <a href="/#donate">Offer it to Hardware Club</a>. We're an independent project, not a nonprofit, so donations aren't tax-deductible.
    </aside>
    <p><a href="/resources">&larr; All resources</a></p>`,
}));

const card = (href, title, text, tag) =>
  `<a class="res-card" href="${href}"><span class="res-tag">${tag}</span><span class="res-title">${title}</span><span class="res-text">${text}</span></a>`;

const hub = {
  url: "/resources",
  crumb: "Resources",
  title: "Free resources for old computers and hardware",
  description:
    "Free guides, tools, checklists and a local directory for wiping, donating, upgrading, repairing and recycling old computers and electronics in Metro Detroit.",
  eyebrow: "Free resources",
  h1: "Free help for old hardware.",
  lede: "Plain-language guides, small tools, printable checklists and a local directory. No sign-up, no cookies, no catch. Written for beginners, with detail for tinkerers.",
  jsonld: {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Hardware Club free resources",
    url: "https://hardwareclub.org/resources",
    hasPart: guides.map((g) => ({
      "@type": "Article",
      headline: g.h1,
      url: `https://hardwareclub.org/resources/${g.slug}`,
    })),
  },
  body: `
    <h2 id="tools">Tools</h2>
    <div class="res-grid">
      ${card("/resources/donate-or-recycle", "Donate, repair, or recycle?", "Answer four questions about a device and get a recommendation.", "Tool")}
      ${card("/resources/wipe-method-picker", "Data-wipe method picker", "Pick your device and get the right erase steps.", "Tool")}
    </div>

    <h2 id="guides">Guides</h2>
    <div class="res-grid">
      ${guides.map((g) => card(`/resources/${g.slug}`, g.h1, g.card, g.level)).join("\n      ")}
    </div>

    <h2 id="downloads-intro">Downloads and directory</h2>
    <div class="res-grid">
      ${card("/resources/downloads", "Printable checklists", "Donation prep, buying refurbished, wipe cheat sheet, and an inventory spreadsheet.", "Download")}
      ${card("/resources/local-directory", "Metro Detroit directory", "Where to take electronics, batteries and repair questions, with official locators.", "Directory")}
    </div>

    <aside class="note-card">
      These resources are general information, not professional, legal or tax advice. Links to other sites are for convenience; Hardware Club doesn't endorse or control them.
    </aside>`,
};

export const pages = [
  hub,
  ...guidePages,
  ...tools.map((t) => ({ ...t, jsonld: undefined })),
  directory,
  downloadsPage,
];

export const files = downloadFiles.map((d) => ({ path: `downloads/${d.file}`, content: d.content }));
