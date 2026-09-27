import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { retentionCutoff } from "../src/retention";

const scheduledTime = Date.parse("2026-09-27T12:34:56.000Z");

async function addSubmission(id: string, createdAt: string) {
  await env.DB.prepare(
    `INSERT INTO submissions
      (id, created_at, name, email, location, categories, description, quantity, powers_on, handoff)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, createdAt, `Name ${id}`, `${id}@example.com`, "Detroit", "[]", "Hardware", "1", "yes", "drop-off")
    .run();
}

afterEach(async () => {
  vi.restoreAllMocks();
  await env.DB.prepare("DELETE FROM submissions").run();
});

describe("submission retention", () => {
  it("computes a UTC calendar-year cutoff, including leap day", () => {
    expect(retentionCutoff(new Date(scheduledTime))).toBe("2025-09-27T12:34:56.000Z");
    expect(retentionCutoff(new Date("2028-02-29T00:00:00.000Z"))).toBe("2027-02-28T00:00:00.000Z");
  });

  it("scheduled handler deletes only rows strictly older than the cutoff and logs only the count", async () => {
    await addSubmission("old", "2025-09-27T12:34:55.999Z");
    await addSubmission("boundary", "2025-09-27T12:34:56.000Z");
    await addSubmission("new", "2025-09-27T12:34:56.001Z");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await worker.scheduled({ scheduledTime } as ScheduledController, env);

    const rows = await env.DB.prepare("SELECT id FROM submissions ORDER BY id").all<{ id: string }>();
    expect(rows.results.map((row) => row.id)).toEqual(["boundary", "new"]);
    expect(log).toHaveBeenCalledWith("Purged 1 expired submissions");
  });
});
