import { env, SELF } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { turnstile, TurnstileConfigError, turnstileConfigProblem } from "../src/turnstile";

const TEST_SITEKEY = "1x00000000000000000000AA";
const TEST_SECRET = "1x0000000000000000000000000000000AA";

type IncomingRequest = Parameters<typeof worker.fetch>[0];

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

function validFormBody() {
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
  return body.toString();
}

function postValidForm(headers: Record<string, string> = {}) {
  return SELF.fetch("https://hardwareclub.org/api/submit", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: validFormBody(),
  });
}

/** Calls the Worker directly so a test can run it with a different env. */
function postWithEnv(overrides: Partial<Env>, origin = "https://hardwareclub.org") {
  const request = new Request(`${origin}/api/submit`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: validFormBody(),
  }) as IncomingRequest;
  return worker.fetch(request, { ...env, ...overrides });
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

  it("returns false and logs the error codes when siteverify rejects the token", async () => {
    stubSiteverify(Response.json({ success: false, "error-codes": ["invalid-input-response"] }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await turnstile.verify("token", "secret", null)).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.any(String), ["invalid-input-response"]);
  });

  it.each(["invalid-input-secret", "missing-input-secret", "bad-request"])(
    "throws TurnstileConfigError when siteverify reports %s",
    async (code) => {
      stubSiteverify(Response.json({ success: false, "error-codes": [code] }));
      vi.spyOn(console, "warn").mockImplementation(() => {});

      await expect(turnstile.verify("token", "secret", null)).rejects.toBeInstanceOf(TurnstileConfigError);
    },
  );

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

describe("turnstileConfigProblem", () => {
  const REAL = { TURNSTILE_SITEKEY: "0x4AAAAAAA-real-sitekey", TURNSTILE_SECRET: "0x4AAAAAAA-real-secret" };

  it("accepts real-looking keys on the production host", () => {
    expect(turnstileConfigProblem(REAL, "hardwareclub.org")).toBeNull();
  });

  it("reports a missing secret or sitekey on any host", () => {
    expect(turnstileConfigProblem({ ...REAL, TURNSTILE_SECRET: undefined }, "localhost")).toMatch(/TURNSTILE_SECRET/);
    expect(turnstileConfigProblem({ ...REAL, TURNSTILE_SECRET: "" }, "hardwareclub.org")).toMatch(/TURNSTILE_SECRET/);
    expect(turnstileConfigProblem({ ...REAL, TURNSTILE_SITEKEY: "" }, "hardwareclub.org")).toMatch(/TURNSTILE_SITEKEY/);
  });

  it("rejects Cloudflare test keys on the production host", () => {
    expect(turnstileConfigProblem({ ...REAL, TURNSTILE_SITEKEY: TEST_SITEKEY }, "hardwareclub.org")).toMatch(
      /TURNSTILE_SITEKEY is a Cloudflare test key/,
    );
    expect(turnstileConfigProblem({ ...REAL, TURNSTILE_SECRET: TEST_SECRET }, "hardwareclub.org")).toMatch(
      /TURNSTILE_SECRET is a Cloudflare test key/,
    );
  });

  it("allows Cloudflare test keys off the production host, for local dev", () => {
    expect(
      turnstileConfigProblem({ TURNSTILE_SITEKEY: TEST_SITEKEY, TURNSTILE_SECRET: TEST_SECRET }, "localhost"),
    ).toBeNull();
  });
});

describe("POST /api/submit with a misconfigured Turnstile", () => {
  it.each([
    ["a missing secret", { TURNSTILE_SECRET: undefined as unknown as string }, /TURNSTILE_SECRET is not set/],
    ["the test sitekey", { TURNSTILE_SITEKEY: TEST_SITEKEY }, /TURNSTILE_SITEKEY is a Cloudflare test key/],
    ["the test secret", { TURNSTILE_SECRET: TEST_SECRET }, /TURNSTILE_SECRET is a Cloudflare test key/],
  ])("fails with a logged 500, not a blame-the-donor 400, for %s", async (_label, overrides, logged) => {
    const spy = stubSiteverify(Response.json({ success: true }));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postWithEnv(overrides);

    expect(response.status).toBe(500);
    const data = (await response.json()) as { ok: boolean; errors: Record<string, string> };
    expect(data.errors.form).toMatch(/isn't working/);
    expect(data.errors.turnstile).toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.stringMatching(logged));
    expect(spy).not.toHaveBeenCalled();
  });

  it("still accepts the test keys off the production host", async () => {
    const spy = stubSiteverify(Response.json({ success: true }));
    vi.spyOn(console, "log").mockImplementation(() => {});

    const response = await postWithEnv(
      { TURNSTILE_SITEKEY: TEST_SITEKEY, TURNSTILE_SECRET: TEST_SECRET, NOTIFY: undefined as unknown as SendEmail },
      "http://localhost:8787",
    );

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
    await env.DB.prepare("DELETE FROM submissions").run();
  });

  it("returns a logged 500 on the no-JS path when siteverify rejects our secret", async () => {
    // Built per call: a body created here can't be read inside SELF's request context.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({ success: false, "error-codes": ["invalid-input-secret"] }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postValidForm();

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("our form isn&#39;t working");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("invalid-input-secret"));
  });
});

describe("GET /api/health with a misconfigured Turnstile", () => {
  it("returns 503 and logs the problem", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await worker.fetch(new Request("https://hardwareclub.org/api/health") as IncomingRequest, {
      ...env,
      TURNSTILE_SITEKEY: TEST_SITEKEY,
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/TURNSTILE_SITEKEY is a Cloudflare test key/));
  });
});
