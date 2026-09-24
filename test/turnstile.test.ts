import { SELF } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { turnstile } from "../src/turnstile";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function stubSiteverify(response: Response | Error) {
  const spy = vi.spyOn(globalThis, "fetch");
  if (response instanceof Error) {
    spy.mockRejectedValue(response);
  } else {
    spy.mockResolvedValue(response);
  }
  return spy;
}

function postValidForm(headers: Record<string, string> = {}) {
  const body = new URLSearchParams();
  body.set("name", "Jordan Rivera");
  body.set("email", "jordan@example.com");
  body.set("location", "Ferndale, MI");
  body.set("description", "One old ThinkPad that still boots");
  body.set("quantity", "1");
  body.set("powers_on", "yes");
  body.set("handoff", "drop-off");
  body.append("categories[]", "laptops");
  body.set("consent", "yes");
  body.set("cf-turnstile-response", "test-token");

  return SELF.fetch("https://hardwareclub.org/api/submit", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: body.toString(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("turnstile.verify against siteverify", () => {
  it("returns false without calling siteverify when the token is empty", async () => {
    const spy = stubSiteverify(Response.json({ success: true }));
    expect(await turnstile.verify("", "secret", null)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("posts the token, secret, and IP to siteverify and returns true on success", async () => {
    const spy = stubSiteverify(Response.json({ success: true }));

    expect(await turnstile.verify("token-123", "secret-abc", "203.0.113.5")).toBe(true);

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(String(url)).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    const sent = init?.body as URLSearchParams;
    expect(sent.get("response")).toBe("token-123");
    expect(sent.get("secret")).toBe("secret-abc");
    expect(sent.get("remoteip")).toBe("203.0.113.5");
  });

  it("returns false when siteverify reports failure", async () => {
    stubSiteverify(Response.json({ success: false, "error-codes": ["invalid-input-response"] }));
    expect(await turnstile.verify("token", "secret", null)).toBe(false);
  });

  it("returns false when siteverify responds with a non-2xx status", async () => {
    stubSiteverify(new Response("bad gateway", { status: 502 }));
    expect(await turnstile.verify("token", "secret", null)).toBe(false);
  });

  it("returns false instead of throwing when siteverify returns a non-JSON body", async () => {
    stubSiteverify(new Response("<html>upstream error</html>", { status: 200 }));
    expect(await turnstile.verify("token", "secret", null)).toBe(false);
  });

  it("returns false instead of throwing when siteverify returns a JSON null body", async () => {
    stubSiteverify(new Response("null", { status: 200 }));
    expect(await turnstile.verify("token", "secret", null)).toBe(false);
  });

  it("returns false instead of throwing when the siteverify request fails", async () => {
    stubSiteverify(new Error("connect ECONNREFUSED"));
    expect(await turnstile.verify("token", "secret", null)).toBe(false);
  });
});

describe("POST /api/submit when siteverify is unreachable", () => {
  it("returns the site's own HTML error page on the no-JS path", async () => {
    const spy = stubSiteverify(new Error("connect ETIMEDOUT"));

    const response = await postValidForm();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("We couldn&#39;t verify you&#39;re human");
    expect(html).toContain('href="/#donate"');
  });

  it("returns a turnstile field error on the JSON path", async () => {
    const spy = stubSiteverify(new Error("connect ETIMEDOUT"));

    const response = await postValidForm({ accept: "application/json" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);
    const data = (await response.json()) as { ok: boolean; errors: Record<string, string> };
    expect(data.ok).toBe(false);
    expect(data.errors.turnstile).toBeTruthy();
  });
});
