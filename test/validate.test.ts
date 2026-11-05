import { describe, expect, it } from "vitest";
import type { RawSubmission } from "../src/body";
import { validateSubmission } from "../src/validate";

function raw(overrides: Partial<RawSubmission> = {}): RawSubmission {
  return {
    name: "Jordan Rivera",
    email: "jordan@example.com",
    phone: "",
    location: "Ferndale, MI",
    categories: ["laptops"],
    description: "One old ThinkPad",
    quantity: "1",
    powers_on: "yes",
    handoff: "drop-off",
    drive_back: false,
    consent: true,
    website: "",
    turnstileToken: "token",
    ...overrides,
  };
}

function data(overrides: Partial<RawSubmission>) {
  const result = validateSubmission(raw(overrides));
  if (!result.ok) throw new Error(`unexpected errors: ${JSON.stringify(result.errors)}`);
  return result.data;
}

describe("validateSubmission field normalization", () => {
  it("folds line breaks and control characters in one-line fields into single spaces", () => {
    const result = data({
      name: "Jordan\r\nBcc: someone@example.com",
      location: "Ferndale, \tMI\u0000",
      phone: " 313\u0007555  0100 ",
    });
    expect(result.name).toBe("Jordan Bcc: someone@example.com");
    expect(result.location).toBe("Ferndale, MI");
    expect(result.phone).toBe("313 555 0100");
  });

  it("strips bidi override and isolate characters", () => {
    const result = data({ name: "Jordan ‮gnirts‬ Rivera", location: "⁦Detroit⁩" });
    expect(result.name).toBe("Jordan gnirts Rivera");
    expect(result.location).toBe("Detroit");
  });

  it("keeps newlines and tabs in the description but normalizes CRLF and drops other controls", () => {
    const result = data({ description: "Line one\r\nLine\ttwo\u0000\rLine three\u001b" });
    expect(result.description).toBe("Line one\nLine\ttwo\nLine three");
  });

  it("treats a name made only of control characters as missing", () => {
    const result = validateSubmission(raw({ name: "\u0000\r\n\u0007" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeTruthy();
  });

  it("applies the length limit after normalization", () => {
    expect(data({ name: `${"a".repeat(60)}\n\n\n\n${"b".repeat(100)}` }).name).toHaveLength(120);
  });

  it.each(["jordan\u0001@example.com", "jordan@exa\u007fmple.com"])("rejects an email containing a control character (%j)", (email) => {
    const result = validateSubmission(raw({ email }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeTruthy();
  });

  it("still accepts an ordinary international address", () => {
    expect(data({ email: "jördan@example.com" }).email).toBe("jördan@example.com");
  });
});
