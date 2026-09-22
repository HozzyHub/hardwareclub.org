import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("www redirect", () => {
  it("301s www.hardwareclub.org to the apex, preserving path and query", async () => {
    const response = await SELF.fetch("https://www.hardwareclub.org/privacy?ref=email", {
      redirect: "manual",
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://hardwareclub.org/privacy?ref=email");
  });
});

describe("GET /", () => {
  it("injects the Turnstile site key into the form", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('data-sitekey="1x00000000000000000000AA"');
  });

  it("sets security headers", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("challenges.cloudflare.com");
  });
});
