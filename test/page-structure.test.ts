import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

// Every page a visitor can land on: everything in the sitemap, plus the pages
// it deliberately leaves out.
async function pagePaths(): Promise<string[]> {
  const sitemap = await (await SELF.fetch("https://hardwareclub.org/sitemap.xml")).text();
  const listed = [...sitemap.matchAll(/<loc>https:\/\/hardwareclub\.org([^<]*)<\/loc>/g)].map((m) => m[1]!);
  return [...listed, "/thanks", "/no-such-page"];
}

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("page structure", () => {
  it("covers the whole sitemap", async () => {
    expect((await pagePaths()).length).toBeGreaterThan(10);
  });

  it("gives every page the landmarks and metadata assistive tech relies on", async () => {
    const problems: string[] = [];
    for (const path of await pagePaths()) {
      const html = await (await SELF.fetch(`https://hardwareclub.org${path}`)).text();
      const check = (ok: boolean, what: string) => {
        if (!ok) problems.push(`${path}: ${what}`);
      };
      check(html.includes('<html lang="en">'), 'missing <html lang="en">');
      check(/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html), "missing viewport meta");
      check(count(html, /<title>[^<]+<\/title>/g) === 1, "needs exactly one non-empty <title>");
      check(count(html, /<main\b/g) === 1, "needs exactly one <main>");
      check(/<main id="main"/.test(html), '<main> must have id="main"');
      check(/<a class="skip-link" href="#main">/.test(html), "missing skip link to #main");
      check(count(html, /<h1\b/g) === 1, "needs exactly one <h1>");
      for (const nav of html.match(/<nav\b[^>]*>/g) ?? []) {
        check(/aria-label="[^"]+"/.test(nav), `unlabelled ${nav}`);
      }
      for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
        check(/\balt="/.test(img), `image without alt: ${img}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
