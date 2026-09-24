import { SELF } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { serveIndex } from "../src/html";

describe("www redirect", () => {
  it("301s www.hardwareclub.org to the apex, preserving path and query", async () => {
    const response = await SELF.fetch("https://www.hardwareclub.org/privacy?ref=email", {
      redirect: "manual",
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://hardwareclub.org/privacy?ref=email");
  });

  it.each(["/privacy", "/thanks", "/styles.css", "/og.png"])(
    "301s www requests for the existing static path %s instead of serving the asset",
    async (path) => {
      const response = await SELF.fetch(`https://www.hardwareclub.org${path}`, { redirect: "manual" });

      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(`https://hardwareclub.org${path}`);
    },
  );
});

describe("static assets", () => {
  it.each(["/privacy", "/thanks", "/styles.css", "/og.png"])(
    "serves %s through the Worker with security headers",
    async (path) => {
      const response = await SELF.fetch(`https://hardwareclub.org${path}`);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("content-security-policy")).toContain("challenges.cloudflare.com");
    },
  );
});

describe("GET /", () => {
  it("injects the Turnstile site key into the form", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('data-sitekey="1x00000000000000000000AA"');
  });

  it("serves the page without cache validators so a site key change is never masked by a 304", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/");
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("last-modified")).toBeNull();
  });

  it("sets security headers", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("challenges.cloudflare.com");
  });
});

describe("serveIndex", () => {
  const STATIC_HTML = '<!doctype html><div class="cf-turnstile" data-sitekey=""></div>';
  const ASSET_ETAG = '"static-asset-hash"';

  function staticAssets() {
    return {
      fetch: vi.fn(async (request: Request) =>
        [ASSET_ETAG, `W/${ASSET_ETAG}`].includes(request.headers.get("if-none-match") ?? "")
          ? new Response(null, { status: 304, headers: { etag: ASSET_ETAG } })
          : new Response(STATIC_HTML, {
              status: 200,
              headers: {
                "content-type": "text/html; charset=utf-8",
                etag: ASSET_ETAG,
                "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT",
              },
            }),
      ),
    };
  }

  it("never lets the asset store answer 304 for a validator the browser learned before a site key change", async () => {
    const assets = staticAssets();
    const request = new Request("https://hardwareclub.org/", {
      headers: { "if-none-match": ASSET_ETAG, "if-modified-since": "Tue, 01 Sep 2026 00:00:00 GMT" },
    });

    const response = await serveIndex(request, assets, "rotated-site-key");

    const upstream = assets.fetch.mock.calls[0]![0];
    expect(upstream.headers.get("if-none-match")).toBeNull();
    expect(upstream.headers.get("if-modified-since")).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('data-sitekey="rotated-site-key"');
  });

  it("drops the asset's validators because the rewritten body no longer matches them", async () => {
    const response = await serveIndex(new Request("https://hardwareclub.org/"), staticAssets(), "site-key");

    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("last-modified")).toBeNull();
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });
});
