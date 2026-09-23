import { env, SELF } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifier } from "../src/email";
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
});
