import { env } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { buildRawMessage, notifier } from "../src/email";
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

const SUBMISSION_ID = "0b6f9a8e-6d3c-4f1e-9a51-3c2b7d8e9f10";

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
    const raw = buildRawMessage("maintainer@example.org", submission, SUBMISSION_ID);
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
    const raw = buildRawMessage("maintainer@example.org", hostile, SUBMISSION_ID);
    const { headers } = splitMessage(raw);
    const lines = headers.split(/\r?\n/);

    expect(lines.filter((line) => /^Subject:/.test(line))).toHaveLength(1);
    expect(lines.some((line) => /^Bcc:/.test(line))).toBe(false);
    expect(headers).not.toContain("evil");
    expect(headers).toMatch(/^Reply-To: <zoe@example\.com>\r?$/m);
    expect(lines.every((line) => /^[\x20-\x7E]*$/.test(line))).toBe(true);
  });

  it("base64-encodes the plain-text body so non-ASCII donor text survives intact", () => {
    const raw = buildRawMessage("maintainer@example.org", submission, SUBMISSION_ID);
    const { headers, body } = splitMessage(raw);

    expect(headers).toMatch(/^Content-Type: text\/plain; charset=UTF-8\r?$/m);
    expect(headers).toMatch(/^Content-Transfer-Encoding: base64\r?$/m);
    expect(body).toMatch(/^[A-Za-z0-9+/=\r\n]+$/);
    expect(body.split(/\r?\n/).every((line) => line.length <= 76)).toBe(true);

    const decoded = decodeBase64(body);
    expect(decoded.split("\n")[0]).toBe(`Submission ID: ${SUBMISSION_ID}`);
    expect(decoded).toContain("Name: Zoë Müller");
    expect(decoded).toContain("Categories: laptops, components");
    expect(decoded).toContain("Wants drive back: yes");
    expect(decoded).toContain(submission.description);
  });
});

function decodeSubject(headers: string): string {
  const encoded = headers.match(/^Subject: (.+)$/m)![1]!.trim();
  return encoded
    .split(/\s+/)
    .map((word) => decodeBase64(word.replace(/^=\?utf-8\?B\?/i, "").replace(/\?=$/, "")))
    .join("");
}

describe("notification content", () => {
  it("summarises categories and location in the subject", () => {
    const { headers } = splitMessage(buildRawMessage("maintainer@example.org", submission, SUBMISSION_ID));
    expect(decodeSubject(headers)).toBe("New hardware offer: laptops, components in Ferndale, MI");
  });

  it("marks a missing phone number and a declined drive return", () => {
    const { body } = splitMessage(
      buildRawMessage("maintainer@example.org", { ...submission, phone: null, drive_back: false }, SUBMISSION_ID),
    );
    const decoded = decodeBase64(body);
    expect(decoded).toContain("Phone: (not provided)");
    expect(decoded).toContain("Wants drive back: no");
  });

  it("keeps the donor's line breaks in the description", () => {
    const description = "Two ThinkPads\nOne won't boot\n\tPlus cables";
    const { body } = splitMessage(buildRawMessage("maintainer@example.org", { ...submission, description }, SUBMISSION_ID));
    expect(decodeBase64(body).endsWith(`Description:\n${description}`)).toBe(true);
  });
});

describe("notifier.send through the NOTIFY binding", () => {
  it("sends one message from the site address to NOTIFY_TO", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const localEnv = { ...env, NOTIFY: { send } } as unknown as Env;

    await notifier.send(localEnv, submission, SUBMISSION_ID);

    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0]![0] as { from: string; to: string };
    expect(message.from).toBe("hello@hardwareclub.org");
    expect(message.to).toBe(env.NOTIFY_TO);
  });

  it("propagates a binding failure so the caller can report it", async () => {
    const localEnv = { ...env, NOTIFY: { send: vi.fn().mockRejectedValue(new Error("unverified destination")) } } as unknown as Env;
    await expect(notifier.send(localEnv, submission, SUBMISSION_ID)).rejects.toThrow("unverified destination");
  });
});
