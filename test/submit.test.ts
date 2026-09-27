import { env, SELF } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifier } from "../src/email";
import { failureAlert } from "../src/failure-alert";
import { handleSubmit, rateLimiter } from "../src/submit";
import { turnstile } from "../src/turnstile";

const VALID_FIELDS: Record<string, string> = {
  name: "Jordan Rivera",
  email: "jordan@example.com",
  phone: "313-555-0100",
  location: "Ferndale, MI",
  description: "Two old ThinkPads, one won't boot, plus a box of cables",
  quantity: "2-5",
  powers_on: "mixed",
  handoff: "drop-off",
  "cf-turnstile-response": "test-token",
};
const realSend = notifier.send;
const directContext = { waitUntil: (_promise: Promise<unknown>) => {} };

function buildFormBody(overrides: Record<string, string | string[] | undefined> = {}, categories = ["laptops"]) {
  const body = new URLSearchParams();
  const fields = { ...VALID_FIELDS, ...overrides };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) continue;
    body.append(key, value);
  }
  for (const category of categories) {
    body.append("categories[]", category);
  }
  body.append("consent", "yes");
  return body;
}

async function submissionRows() {
  const result = await env.DB.prepare("SELECT * FROM submissions").all();
  return result.results as Array<Record<string, unknown>>;
}

async function withoutSubmissionsTable(run: () => Promise<void>) {
  await env.DB.exec("ALTER TABLE submissions RENAME TO submissions_unavailable");
  try {
    await run();
  } finally {
    await env.DB.exec("ALTER TABLE submissions_unavailable RENAME TO submissions");
  }
}

beforeEach(() => {
  turnstile.verify = async () => true;
  notifier.send = vi.fn().mockResolvedValue(undefined);
  rateLimiter.limit = vi.fn().mockResolvedValue({ success: true });
  failureAlert.send = vi.fn().mockResolvedValue(new Response("OK"));
});

afterEach(async () => {
  await env.DB.prepare("DELETE FROM submissions").run();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("POST /api/submit", () => {
  it("allows a request and keys the limiter on CF-Connecting-IP", async () => {
    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
        "cf-connecting-ip": "192.0.2.10",
      },
      body: buildFormBody().toString(),
    });

    expect(response.status).toBe(200);
    expect(rateLimiter.limit).toHaveBeenCalledTimes(1);
    expect(vi.mocked(rateLimiter.limit).mock.calls[0]![0] === env.SUBMIT_RATE_LIMIT).toBe(true);
    expect(vi.mocked(rateLimiter.limit).mock.calls[0]![1]).toBe("192.0.2.10");
    expect(await submissionRows()).toHaveLength(1);
  });

  it("returns the normal JSON error before reading a limited submission", async () => {
    rateLimiter.limit = vi.fn().mockResolvedValue({ success: false });
    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: "not JSON",
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Too many submissions. Please try again in a minute." },
    });
    expect(await submissionRows()).toHaveLength(0);
    expect(notifier.send).not.toHaveBeenCalled();
  });

  it("returns the normal HTML error for a limited no-JS submission", async () => {
    rateLimiter.limit = vi.fn().mockResolvedValue({ success: false });
    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: buildFormBody().toString(),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("Too many submissions. Please try again in a minute.");
    expect(await submissionRows()).toHaveLength(0);
  });

  it("allows a local request when the binding is absent", async () => {
    const localEnv = { ...env, SUBMIT_RATE_LIMIT: undefined } as unknown as Env;
    const request = new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: buildFormBody().toString(),
    });

    const response = await handleSubmit(request, localEnv, directContext);

    expect(response.status).toBe(200);
    expect(rateLimiter.limit).not.toHaveBeenCalled();
    expect(await submissionRows()).toHaveLength(1);
  });

  it("rejects a production request when the binding is absent", async () => {
    const localEnv = { ...env, SUBMIT_RATE_LIMIT: undefined } as unknown as Env;
    const request = new Request("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { accept: "application/json" },
    });

    const response = await handleSubmit(request, localEnv, directContext);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Sorry, our form isn't working right now. Please try again later." },
    });
    expect(rateLimiter.limit).not.toHaveBeenCalled();
  });

  it("treats a filled honeypot as success and stores nothing", async () => {
    const body = buildFormBody({ website: "https://spam.example" });

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await submissionRows()).toHaveLength(0);
  });

  it("rejects when Turnstile verification fails", async () => {
    turnstile.verify = async () => false;
    const body = buildFormBody();

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { ok: boolean };
    expect(data.ok).toBe(false);
    expect(await submissionRows()).toHaveLength(0);
  });

  it("returns field errors for missing required fields", async () => {
    const body = new URLSearchParams();
    body.append("cf-turnstile-response", "test-token");

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { ok: boolean; errors: Record<string, string> };
    expect(data.ok).toBe(false);
    expect(data.errors.name).toBeTruthy();
    expect(data.errors.email).toBeTruthy();
    expect(data.errors.location).toBeTruthy();
    expect(data.errors.description).toBeTruthy();
    expect(data.errors.categories).toBeTruthy();
    expect(data.errors.consent).toBeTruthy();
    expect(await submissionRows()).toHaveLength(0);
  });

  it("rejects a malformed email address", async () => {
    const body = buildFormBody({ email: "not-an-email" });

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { errors: Record<string, string> };
    expect(data.errors.email).toBeTruthy();
    expect(await submissionRows()).toHaveLength(0);
  });

  // Each of these would otherwise reach the notification's Reply-To header.
  it.each(["a<b>@c.de", 'x"y@c.de', "a,b@c.de", "a;b@c.de", "a:b@c.de", "a(b)@c.de", "a\\b@c.de", "a@[c].de"])(
    "rejects the address-header-breaking email %s",
    async (email) => {
      const body = buildFormBody({ email });

      const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: body.toString(),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { errors: Record<string, string> };
      expect(data.errors.email).toBeTruthy();
      expect(await submissionRows()).toHaveLength(0);
    },
  );

  it.each(["o'brien+donations@mail.example.co.uk", "first.last@example.com"])(
    "accepts the ordinary email %s",
    async (email) => {
      const body = buildFormBody({ email });

      const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: body.toString(),
      });

      expect(response.status).toBe(200);
      expect((await submissionRows())[0]!.email).toBe(email);
    },
  );

  it("rejects an unknown category", async () => {
    const body = buildFormBody({}, ["not-a-real-category"]);

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { errors: Record<string, string> };
    expect(data.errors.categories).toBeTruthy();
    expect(await submissionRows()).toHaveLength(0);
  });

  it("rejects more than 8 categories", async () => {
    const body = buildFormBody({}, [
      "laptops",
      "desktops",
      "servers",
      "phones-tablets",
      "networking",
      "components",
      "peripherals-cables",
      "other",
      "laptops",
    ]);

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { errors: Record<string, string> };
    expect(data.errors.categories).toBeTruthy();
    expect(await submissionRows()).toHaveLength(0);
  });

  it("accepts a valid form-encoded submission, redirects to /thanks, and stores a normalized row", async () => {
    const body = buildFormBody(
      { name: "  Jordan Rivera  ", drive_back: "yes" },
      ["laptops", "components"],
    );

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "manual",
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://hardwareclub.org/thanks");

    const rows = await submissionRows();
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.name).toBe("Jordan Rivera");
    expect(row.email).toBe("jordan@example.com");
    expect(JSON.parse(row.categories as string)).toEqual(["laptops", "components"]);
    expect(row.drive_back).toBe(1);
    expect(row.consent).toBe(1);
    expect(row.status).toBe("new");

    expect(notifier.send).toHaveBeenCalledTimes(1);
    expect(failureAlert.send).not.toHaveBeenCalled();
  });

  it("accepts a valid JSON submission", async () => {
    const payload = {
      name: "Sam Lee",
      email: "sam@example.com",
      phone: "",
      location: "Royal Oak, MI",
      categories: ["servers"],
      description: "A retired home server, powers on fine.",
      quantity: "1",
      powers_on: "yes",
      handoff: "figure-it-out",
      drive_back: false,
      consent: true,
      "cf-turnstile-response": "test-token",
    };

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const rows = await submissionRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.email).toBe("sam@example.com");
  });

  it("still succeeds and stores the row when sending the notification email throws", async () => {
    notifier.send = vi.fn().mockRejectedValue(new Error("email service down"));
    const body = buildFormBody();

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await submissionRows()).toHaveLength(1);
    await vi.waitFor(() => expect(failureAlert.send).toHaveBeenCalledExactlyOnceWith("test-fail-url", { method: "POST", body: "notify" }));
  });

  it("keeps the visitor response when the failure ping rejects", async () => {
    notifier.send = vi.fn().mockRejectedValue(new Error("email service down"));
    failureAlert.send = vi.fn().mockRejectedValue(new Error("ping service down"));

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: buildFormBody().toString(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await submissionRows()).toHaveLength(1);
    await vi.waitFor(() => expect(failureAlert.send).toHaveBeenCalledExactlyOnceWith("test-fail-url", { method: "POST", body: "notify" }));
  });

  it("does not ping when the optional failure URL is absent", async () => {
    notifier.send = vi.fn().mockRejectedValue(new Error("email service down"));
    const localEnv = { ...env, HC_FAIL_URL: undefined } as Env;
    const request = new Request("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: buildFormBody().toString(),
    });

    const response = await handleSubmit(request, localEnv, directContext);

    expect(response.status).toBe(200);
    expect(failureAlert.send).not.toHaveBeenCalled();
  });

  it("does not log donor details when the email binding is absent", async () => {
    notifier.send = realSend;
    const localEnv = { ...env, NOTIFY: undefined } as unknown as Env;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const request = new Request("https://hardwareclub.org/api/submit", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: buildFormBody().toString(),
      });

      const response = await handleSubmit(request, localEnv, directContext);

      expect(response.status).toBe(200);
      expect(log).toHaveBeenCalledWith("NOTIFY binding unavailable; donation notification email skipped");
      expect(JSON.stringify(log.mock.calls)).not.toContain(VALID_FIELDS.email);
      expect(JSON.stringify(log.mock.calls)).not.toContain(VALID_FIELDS.description);
    } finally {
      log.mockRestore();
    }
  });

  it("returns the site's own HTML error page when storing the submission fails on the no-JS path", async () => {
    await withoutSubmissionsTable(async () => {
      const body = buildFormBody();

      const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("text/html");
      const html = await response.text();
      expect(html).toContain("There was a problem with your submission");
      expect(html).toContain('href="/#donate"');
      expect(notifier.send).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(failureAlert.send).toHaveBeenCalledExactlyOnceWith("test-fail-url", { method: "POST", body: "d1-insert" }));
    });
  });

  it("returns a form-level JSON error when storing the submission fails on the JS path", async () => {
    await withoutSubmissionsTable(async () => {
      const body = buildFormBody();

      const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: body.toString(),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { ok: boolean; errors: Record<string, string> };
      expect(data.ok).toBe(false);
      expect(data.errors.form).toBeTruthy();
      expect(notifier.send).not.toHaveBeenCalled();
    });
  });

  it("accepts the browser's multipart FormData submission", async () => {
    const formData = new FormData();
    for (const [key, value] of buildFormBody()) {
      formData.append(key, value);
    }

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { accept: "application/json" },
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await submissionRows()).toHaveLength(1);
  });

  it("rejects oversized bodies with 413", async () => {
    const body = buildFormBody({ description: "x".repeat(20 * 1024) });

    const response = await SELF.fetch("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });

    expect(response.status).toBe(413);
    expect(await submissionRows()).toHaveLength(0);
  });

  it("rejects oversized streamed bodies that carry no Content-Length with 413", async () => {
    turnstile.verify = vi.fn().mockResolvedValue(true);
    const chunk = new TextEncoder().encode(buildFormBody({ description: "x".repeat(4 * 1024) }).toString());
    const request = new Request("https://hardwareclub.org/api/submit", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          for (let i = 0; i < 8; i++) controller.enqueue(chunk);
          controller.close();
        },
      }),
    });
    expect(request.headers.get("content-length")).toBeNull();

    const response = await SELF.fetch(request);

    expect(response.status).toBe(413);
    expect(turnstile.verify).not.toHaveBeenCalled();
    expect(await submissionRows()).toHaveLength(0);
  });
});
