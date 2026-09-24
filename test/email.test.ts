import { describe, expect, it } from "vitest";
import { buildRawMessage } from "../src/email";
import type { NormalizedSubmission } from "../src/validate";

const submission: NormalizedSubmission = {
  name: "Zoë Müller",
  email: "zoe@example.com",
  phone: null,
  location: "Ferndale, MI",
  categories: ["laptops", "components"],
  description: "Two “old” ThinkPads — one won’t boot — plus a box of cables. Café-grade condition.",
  quantity: "2-5",
  powers_on: "mixed",
  handoff: "drop-off",
  drive_back: true,
  consent: true,
};

function splitMessage(raw: string): { headers: string; body: string } {
  const separator = raw.search(/\r?\n\r?\n/);
  return {
    headers: raw.slice(0, separator),
    body: raw.slice(separator).trim(),
  };
}

function decodeBase64(text: string): string {
  const binary = atob(text.replace(/\s+/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

describe("buildRawMessage", () => {
  it("addresses the notification to the configured recipient with the donor as Reply-To", () => {
    const raw = buildRawMessage("maintainer@example.org", submission);
    const { headers } = splitMessage(raw);

    expect(headers).toMatch(/^To: <maintainer@example\.org>\r?$/m);
    expect(headers).toMatch(/^From: .*<hello@hardwareclub\.org>\r?$/m);
    expect(headers).toMatch(/^Reply-To: <zoe@example\.com>\r?$/m);
    expect(headers).toMatch(/^Subject: =\?utf-8\?B\?/m);
  });

  it("keeps donor-supplied text out of the header block", () => {
    const hostile: NormalizedSubmission = {
      ...submission,
      name: "x\r\nSubject: Action required\r\n\r\n<b>evil</b>",
      location: "Detroit\r\nBcc: victim@example.com",
    };
    const raw = buildRawMessage("maintainer@example.org", hostile);
    const { headers } = splitMessage(raw);
    const lines = headers.split(/\r?\n/);

    expect(lines.filter((line) => /^Subject:/.test(line))).toHaveLength(1);
    expect(lines.some((line) => /^Bcc:/.test(line))).toBe(false);
    expect(headers).not.toContain("evil");
    expect(headers).toMatch(/^Reply-To: <zoe@example\.com>\r?$/m);
    expect(lines.every((line) => /^[\x20-\x7E]*$/.test(line))).toBe(true);
  });

  it("base64-encodes the plain-text body so non-ASCII donor text survives intact", () => {
    const raw = buildRawMessage("maintainer@example.org", submission);
    const { headers, body } = splitMessage(raw);

    expect(headers).toMatch(/^Content-Type: text\/plain; charset=UTF-8\r?$/m);
    expect(headers).toMatch(/^Content-Transfer-Encoding: base64\r?$/m);
    expect(body).toMatch(/^[A-Za-z0-9+/=\r\n]+$/);
    expect(body.split(/\r?\n/).every((line) => line.length <= 76)).toBe(true);

    const decoded = decodeBase64(body);
    expect(decoded).toContain("Name: Zoë Müller");
    expect(decoded).toContain("Categories: laptops, components");
    expect(decoded).toContain("Wants drive back: yes");
    expect(decoded).toContain(submission.description);
  });
});
