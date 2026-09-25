import { APEX_HOST } from "./site";

export interface TurnstileVerifier {
  verify(token: string, secret: string, ip: string | null): Promise<boolean>;
}

// Cloudflare's published testing keys
// (https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
// They pass or fail every visitor regardless of who they are, so on the
// production host they mean Turnstile is either off or rejecting everyone.
const TEST_SITEKEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);
const TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

// siteverify error codes that mean our setup is wrong, not the visitor's token.
const CONFIG_ERROR_CODES = new Set(["missing-input-secret", "invalid-input-secret", "bad-request"]);

/** Thrown when siteverify says the problem is our configuration, not the visitor. */
export class TurnstileConfigError extends Error {}

/**
 * Returns a description of what is wrong with the Turnstile configuration for
 * a request to `hostname`, or null when it looks usable. Test keys are only
 * allowed off the production host (local dev).
 */
export function turnstileConfigProblem(
  env: { TURNSTILE_SITEKEY?: string; TURNSTILE_SECRET?: string },
  hostname: string,
): string | null {
  if (!env.TURNSTILE_SITEKEY) return "TURNSTILE_SITEKEY is not set";
  if (!env.TURNSTILE_SECRET) return "TURNSTILE_SECRET is not set";
  if (hostname === APEX_HOST) {
    if (TEST_SITEKEYS.has(env.TURNSTILE_SITEKEY)) return "TURNSTILE_SITEKEY is a Cloudflare test key";
    if (TEST_SECRETS.has(env.TURNSTILE_SECRET)) return "TURNSTILE_SECRET is a Cloudflare test key";
  }
  return null;
}

async function verifyWithCloudflare(token: string, secret: string, ip: string | null): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  let data: { success?: boolean; "error-codes"?: unknown } | null;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });

    if (!res.ok) return false;

    data = await res.json();
  } catch (err) {
    console.error("Turnstile siteverify request failed", err);
    return false;
  }

  if (data?.success === true) return true;

  const codes = Array.isArray(data?.["error-codes"]) ? (data["error-codes"] as unknown[]).map(String) : [];
  console.warn("Turnstile siteverify rejected the token", codes);
  if (codes.some((code) => CONFIG_ERROR_CODES.has(code))) {
    throw new TurnstileConfigError(`siteverify reported ${codes.join(", ")}`);
  }
  return false;
}

/**
 * A mutable singleton so tests running through SELF.fetch() (same isolate)
 * can stub verification without real network calls.
 */
export const turnstile: TurnstileVerifier = {
  verify: verifyWithCloudflare,
};
