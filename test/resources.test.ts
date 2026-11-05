import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const PAGES = [
  "/resources",
  "/resources/wipe-a-drive-before-donating",
  "/resources/prepare-a-laptop-for-donation",
  "/resources/find-your-computer-specs",
  "/resources/repair-or-replace-old-computer",
  "/resources/upgrade-ram-and-ssd",
  "/resources/linux-on-an-old-pc",
  "/resources/batteries-and-e-waste-safety",
  "/resources/buying-refurbished-hardware",
  "/resources/donate-or-recycle",
  "/resources/wipe-method-picker",
  "/resources/local-directory",
  "/resources/downloads",
];

const DOWNLOADS = [
  "hardwareclub-donation-prep-checklist.txt",
  "hardwareclub-wipe-cheatsheet.txt",
  "hardwareclub-refurb-buying-checklist.txt",
  "hardwareclub-device-inventory.csv",
];

describe("resources section", () => {
  it.each(PAGES)("serves %s with security headers", async (path) => {
    const response = await SELF.fetch(`https://hardwareclub.org${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    const html = await response.text();
    expect(html).toContain(`<link rel="canonical" href="https://hardwareclub.org${path}">`);
  });

  it.each(PAGES)("lists %s in the sitemap", async (path) => {
    const sitemap = await (await SELF.fetch("https://hardwareclub.org/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>https://hardwareclub.org${path}</loc>`);
  });

  it.each(DOWNLOADS)("serves download %s", async (file) => {
    const response = await SELF.fetch(`https://hardwareclub.org/downloads/${file}`);
    expect(response.status).toBe(200);
    expect((await response.text()).length).toBeGreaterThan(20);
  });

  it("serves the tools script and tool pages load it without inline scripts", async () => {
    const js = await SELF.fetch("https://hardwareclub.org/tools.js");
    expect(js.status).toBe(200);
    for (const path of ["/resources/donate-or-recycle", "/resources/wipe-method-picker"]) {
      const html = await (await SELF.fetch(`https://hardwareclub.org${path}`)).text();
      expect(html).toContain('<script src="/tools.js" defer></script>');
      expect(html).not.toMatch(/<script>(?!\s*$)/);
    }
  });

  it("links to resources from the home page", async () => {
    const html = await (await SELF.fetch("https://hardwareclub.org/")).text();
    expect(html).toContain('href="/resources"');
  });
});
